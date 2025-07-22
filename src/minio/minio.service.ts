import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { FileProcessingService, FileInfo, ImageVersions } from './file-processing.service';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileProcessingService: FileProcessingService
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'dentistflow-files';
    
    this.s3Client = new S3Client({
      endpoint: `http://${this.configService.get<string>('MINIO_ENDPOINT')}:${this.configService.get<string>('MINIO_PORT')}`,
      region: this.configService.get<string>('MINIO_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ROOT_USER') || 'minioadmin',
        secretAccessKey: this.configService.get<string>('MINIO_ROOT_PASSWORD') || 'minioadmin123',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    await this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(new HeadBucketCommand({
        Bucket: this.bucketName,
      }));
      this.logger.log(`Bucket ${this.bucketName} already exists`);
    } catch (error: any) {
      // Bucket doesn't exist, create it
      if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Creating bucket: ${this.bucketName}`);
        try {
          await this.s3Client.send(new CreateBucketCommand({
            Bucket: this.bucketName,
          }));
          this.logger.log(`Bucket ${this.bucketName} created successfully`);
        } catch (createError) {
          this.logger.error(`Failed to create bucket ${this.bucketName}:`, createError);
          throw createError;
        }
      } else {
        this.logger.error(`Error checking bucket ${this.bucketName}:`, error);
        throw error;
      }
    }
  }

  async uploadFile(
    key: string,
    file: Buffer | Readable,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully: ${key}`);
      
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file content received');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as Readable;
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      this.logger.error(`Failed to download file ${key}:`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  async deleteFileWithVersions(key: string): Promise<void> {
    try {
      // First, get file info to check if it's an image with versions
      const fileInfo = await this.getFileInfo(key);
      
      if (fileInfo.exists && fileInfo.urls) {
        // Delete all image versions
        const deletePromises: Promise<void>[] = [];
        
        if (fileInfo.urls.thumbnail) {
          deletePromises.push(this.deleteFile(fileInfo.urls.thumbnail));
        }
        if (fileInfo.urls.small) {
          deletePromises.push(this.deleteFile(fileInfo.urls.small));
        }
        if (fileInfo.urls.medium) {
          deletePromises.push(this.deleteFile(fileInfo.urls.medium));
        }
        if (fileInfo.urls.large) {
          deletePromises.push(this.deleteFile(fileInfo.urls.large));
        }
        if (fileInfo.urls.original) {
          deletePromises.push(this.deleteFile(fileInfo.urls.original));
        }
        
        await Promise.all(deletePromises);
        this.logger.log(`All versions of file deleted successfully: ${key}`);
      } else {
        // If no versions found, just delete the original file
        await this.deleteFile(key);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file with versions ${key}:`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  getFileUrl(key: string): string {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<string>('MINIO_PORT');
    return `http://${endpoint}:${port}/${this.bucketName}/${key}`;
  }

  /**
   * Upload file with enhanced processing (UUID naming, image optimization)
   */
  async uploadFileWithProcessing(
    file: Express.Multer.File,
    customFolder?: string
  ): Promise<{
    uuid: string;
    originalName: string;
    safeName: string;
    urls: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      original: string;
    };
    size: number;
    isImage: boolean;
    metadata: Record<string, string>;
  }> {
    // Generate safe filename
    const fileInfo = this.fileProcessingService.generateSafeFileName(file.originalname);
    fileInfo.size = file.size;

    // Generate folder structure
    const folderStructure = this.fileProcessingService.generateFolderStructure(fileInfo, customFolder);

    // Process file based on type
    if (fileInfo.isImage) {
      return await this.processAndUploadImage(file.buffer, fileInfo, folderStructure);
    } else {
      return await this.uploadRegularFile(file.buffer, fileInfo, folderStructure);
    }
  }

  /**
   * Process and upload image with multiple sizes
   */
  private async processAndUploadImage(
    buffer: Buffer,
    fileInfo: FileInfo,
    folderStructure: ReturnType<typeof this.fileProcessingService.generateFolderStructure>
  ) {
    // Process image to create multiple sizes
    const imageVersions = await this.fileProcessingService.processImage(buffer);

    // Upload all versions
    const uploadPromises = [
      this.uploadFile(folderStructure.thumbnailPath, imageVersions.thumbnail, fileInfo.mimeType, {
        originalName: fileInfo.originalName,
        size: imageVersions.thumbnail.length.toString(),
        uploadedAt: new Date().toISOString(),
        version: 'thumbnail'
      }),
      this.uploadFile(folderStructure.smallPath, imageVersions.small, fileInfo.mimeType, {
        originalName: fileInfo.originalName,
        size: imageVersions.small.length.toString(),
        uploadedAt: new Date().toISOString(),
        version: 'small'
      }),
      this.uploadFile(folderStructure.mediumPath, imageVersions.medium, fileInfo.mimeType, {
        originalName: fileInfo.originalName,
        size: imageVersions.medium.length.toString(),
        uploadedAt: new Date().toISOString(),
        version: 'medium'
      }),
      this.uploadFile(folderStructure.largePath, imageVersions.large, fileInfo.mimeType, {
        originalName: fileInfo.originalName,
        size: imageVersions.large.length.toString(),
        uploadedAt: new Date().toISOString(),
        version: 'large'
      }),
      this.uploadFile(folderStructure.originalPath, imageVersions.original, fileInfo.mimeType, {
        originalName: fileInfo.originalName,
        size: imageVersions.original.length.toString(),
        uploadedAt: new Date().toISOString(),
        version: 'original'
      })
    ];

    await Promise.all(uploadPromises);

    return {
      uuid: fileInfo.uuid,
      originalName: fileInfo.originalName,
      safeName: fileInfo.safeName,
      urls: {
        thumbnail: this.getFileUrl(folderStructure.thumbnailPath),
        small: this.getFileUrl(folderStructure.smallPath),
        medium: this.getFileUrl(folderStructure.mediumPath),
        large: this.getFileUrl(folderStructure.largePath),
        original: this.getFileUrl(folderStructure.originalPath)
      },
      size: fileInfo.size,
      isImage: true,
      metadata: {
        originalName: fileInfo.originalName,
        size: fileInfo.size.toString(),
        uploadedAt: new Date().toISOString(),
        uuid: fileInfo.uuid
      }
    };
  }

  /**
   * Upload regular file (non-image)
   */
  private async uploadRegularFile(
    buffer: Buffer,
    fileInfo: FileInfo,
    folderStructure: ReturnType<typeof this.fileProcessingService.generateFolderStructure>
  ) {
    await this.uploadFile(folderStructure.originalPath, buffer, fileInfo.mimeType, {
      originalName: fileInfo.originalName,
      size: fileInfo.size.toString(),
      uploadedAt: new Date().toISOString(),
      uuid: fileInfo.uuid
    });

    return {
      uuid: fileInfo.uuid,
      originalName: fileInfo.originalName,
      safeName: fileInfo.safeName,
      urls: {
        original: this.getFileUrl(folderStructure.originalPath)
      },
      size: fileInfo.size,
      isImage: false,
      metadata: {
        originalName: fileInfo.originalName,
        size: fileInfo.size.toString(),
        uploadedAt: new Date().toISOString(),
        uuid: fileInfo.uuid
      }
    };
  }

  /**
   * Replace file with versioning
   */
  async replaceFile(
    originalKey: string,
    newFile: Express.Multer.File,
    customFolder?: string
  ): Promise<{
    uuid: string;
    originalName: string;
    safeName: string;
    urls: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      original: string;
    };
    size: number;
    isImage: boolean;
    metadata: Record<string, string>;
  }> {
    // Backup original file
    const backupKey = `${originalKey}.backup.${Date.now()}`;
    try {
      const originalBuffer = await this.downloadFile(originalKey);
      await this.uploadFile(backupKey, originalBuffer);
      this.logger.log(`Backup created: ${backupKey}`);
    } catch (error) {
      this.logger.warn(`Could not create backup for ${originalKey}:`, error);
    }

    // Delete original file
    await this.deleteFile(originalKey);

    // Upload new file
    return await this.uploadFileWithProcessing(newFile, customFolder);
  }

  /**
   * Get file info and URLs for all versions
   */
  async getFileInfo(key: string): Promise<{
    exists: boolean;
    urls?: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      original: string;
    };
    metadata?: Record<string, string>;
  }> {
    const exists = await this.fileExists(key);
    
    if (!exists) {
      return { exists: false };
    }

    // Try to find image versions
    const baseKey = key.replace(/\.(thumbnail|small|medium|large|original)\./, '.');
    const folder = key.split('/').slice(0, -1).join('/');
    const filename = key.split('/').pop() || '';

    const urls: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      original: string;
    } = {
      original: key // Return file key instead of full URL
    };

    // Check if image versions exist
    const thumbnailKey = `${folder}/thumbnails/${filename}`;
    const smallKey = `${folder}/small/${filename}`;
    const mediumKey = `${folder}/medium/${filename}`;
    const largeKey = `${folder}/large/${filename}`;

    if (await this.fileExists(thumbnailKey)) {
      urls.thumbnail = thumbnailKey; // Return file key instead of full URL
    }
    if (await this.fileExists(smallKey)) {
      urls.small = smallKey; // Return file key instead of full URL
    }
    if (await this.fileExists(mediumKey)) {
      urls.medium = mediumKey; // Return file key instead of full URL
    }
    if (await this.fileExists(largeKey)) {
      urls.large = largeKey; // Return file key instead of full URL
    }

    return {
      exists: true,
      urls,
      metadata: {} // You can add metadata retrieval here if needed
    };
  }
} 