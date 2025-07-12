import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface ImageVersions {
  thumbnail: Buffer;
  small: Buffer;
  medium: Buffer;
  large: Buffer;
  original: Buffer;
}

export interface FileInfo {
  uuid: string;
  originalName: string;
  safeName: string;
  extension: string;
  mimeType: string;
  size: number;
  isImage: boolean;
}

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  /**
   * Generate a safe filename with UUID
   */
  generateSafeFileName(originalName: string): FileInfo {
    const uuid = uuidv4();
    const extension = path.extname(originalName).toLowerCase();
    const nameWithoutExt = path.basename(originalName, extension);
    
    // Sanitize the original name (remove special characters, limit length)
    const sanitizedName = this.sanitizeFileName(nameWithoutExt);
    const safeName = `${uuid}_${sanitizedName}${extension}`;
    
    return {
      uuid,
      originalName,
      safeName,
      extension,
      mimeType: this.getMimeType(extension),
      size: 0, // Will be set later
      isImage: this.isImageFile(extension)
    };
  }

  /**
   * Sanitize filename to prevent security issues
   */
  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\s\-_\.]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
  }

  /**
   * Check if file is an image
   */
  private isImageFile(extension: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Process image and create multiple sizes
   */
  async processImage(buffer: Buffer): Promise<ImageVersions> {
    try {
      const sharpInstance = sharp(buffer);
      
      // Get original image info
      const metadata = await sharpInstance.metadata();
      
      // Create different sizes
      const thumbnail = await sharpInstance
        .resize(150, 150, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const small = await sharpInstance
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const medium = await sharpInstance
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();

      const large = await sharpInstance
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 95 })
        .toBuffer();

      // Keep original as backup
      const original = buffer;

      this.logger.log(`Image processed successfully. Sizes: thumbnail(${thumbnail.length}), small(${small.length}), medium(${medium.length}), large(${large.length}), original(${original.length})`);

      return {
        thumbnail,
        small,
        medium,
        large,
        original
      };
    } catch (error) {
      this.logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Convert image to WebP format
   */
  async convertToWebP(buffer: Buffer, quality: number = 80): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .webp({ quality })
        .toBuffer();
    } catch (error) {
      this.logger.error('Error converting to WebP:', error);
      throw new Error('Failed to convert image to WebP');
    }
  }

  /**
   * Generate folder structure for organized storage
   */
  generateFolderStructure(fileInfo: FileInfo, customFolder?: string): {
    basePath: string;
    thumbnailPath: string;
    smallPath: string;
    mediumPath: string;
    largePath: string;
    originalPath: string;
  } {
    const baseFolder = customFolder || 'uploads';
    const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const basePath = `${baseFolder}/${dateFolder}`;
    
    if (fileInfo.isImage) {
      return {
        basePath,
        thumbnailPath: `${basePath}/thumbnails/${fileInfo.safeName}`,
        smallPath: `${basePath}/small/${fileInfo.safeName}`,
        mediumPath: `${basePath}/medium/${fileInfo.safeName}`,
        largePath: `${basePath}/large/${fileInfo.safeName}`,
        originalPath: `${basePath}/original/${fileInfo.safeName}`
      };
    } else {
      // For non-images, just use the base path
      return {
        basePath,
        thumbnailPath: `${basePath}/${fileInfo.safeName}`,
        smallPath: `${basePath}/${fileInfo.safeName}`,
        mediumPath: `${basePath}/${fileInfo.safeName}`,
        largePath: `${basePath}/${fileInfo.safeName}`,
        originalPath: `${basePath}/${fileInfo.safeName}`
      };
    }
  }
} 