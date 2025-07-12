import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Attachment, AttachmentType } from './entities/attachment.entity';
import { MinioService } from '../minio/minio.service';
import { CreateAttachmentDto } from './dtos/create-attachment.dto';
import { UpdateAttachmentDto } from './dtos/update-attachment.dto';
import { FilterAttachmentDto } from './dtos/filter-attachment.dto';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
    private readonly minioService: MinioService,
  ) {}

  async uploadAttachment(
    file: Express.Multer.File,
    patientId: string,
    tenantId: string,
    description?: string,
    uploadedById?: string
  ): Promise<Attachment> {
    // Validate file
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    // Determine attachment type based on file extension
    const attachmentType = this.getAttachmentType(file.originalname);

    // Upload file to MinIO with processing
    const uploadResult = await this.minioService.uploadFileWithProcessing(
      file,
      `patients/${patientId}/attachments`
    );

    // Create attachment record
    const attachment = this.repo.create({
      patientId,
      tenantId,
      fileName: uploadResult.originalName,
      filePath: uploadResult.urls.original, // Store the MinIO key
      type: attachmentType,
      fileSize: uploadResult.size,
      uploadedById,
      description,
    });

    return this.repo.save(attachment);
  }

  async findAll(tenantId: string, filters: FilterAttachmentDto = {}): Promise<{ attachments: Attachment[]; total: number }> {
    const { patientId, type, search, page = 1, limit = 10 } = filters;
    
    const queryBuilder = this.repo.createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.patient', 'patient')
      .leftJoinAndSelect('attachment.tenant', 'tenant')
      .where('attachment.tenantId = :tenantId', { tenantId })
      .andWhere('attachment.deletedAt IS NULL');

    // Apply filters
    if (patientId) {
      queryBuilder.andWhere('attachment.patientId = :patientId', { patientId });
    }

    if (type) {
      queryBuilder.andWhere('attachment.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(attachment.fileName ILIKE :search OR attachment.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('attachment.createdAt', 'DESC');

    const [attachments, total] = await queryBuilder.getManyAndCount();

    return { attachments, total };
  }

  async findByPatientId(patientId: string, tenantId: string, filters: FilterAttachmentDto = {}): Promise<{ attachments: Attachment[]; total: number }> {
    const queryBuilder = this.repo.createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.patient', 'patient')
      .leftJoinAndSelect('attachment.tenant', 'tenant')
      .where('attachment.patientId = :patientId', { patientId })
      .andWhere('attachment.tenantId = :tenantId', { tenantId })
      .andWhere('attachment.deletedAt IS NULL');

    // Apply additional filters
    const { type, search, page = 1, limit = 10 } = filters;

    if (type) {
      queryBuilder.andWhere('attachment.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(attachment.fileName ILIKE :search OR attachment.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('attachment.createdAt', 'DESC');

    const [attachments, total] = await queryBuilder.getManyAndCount();

    return { attachments, total };
  }

  async findOne(id: string, tenantId: string): Promise<Attachment> {
    const attachment = await this.repo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['patient', 'tenant']
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async update(id: string, updateData: UpdateAttachmentDto, tenantId: string): Promise<Attachment> {
    const attachment = await this.findOne(id, tenantId);

    Object.assign(attachment, updateData);
    return this.repo.save(attachment);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const attachment = await this.findOne(id, tenantId);
    
    // Delete file from MinIO
    try {
      await this.minioService.deleteFile(attachment.filePath);
    } catch (error) {
      // Log error but don't fail the operation
      console.error(`Failed to delete file from MinIO: ${attachment.filePath}`, error);
    }

    // Soft delete the record
    await this.repo.softDelete(id);
  }

  async getFileDownloadUrl(id: string, tenantId: string): Promise<string> {
    const attachment = await this.findOne(id, tenantId);
    
    // Generate signed URL for download
    return this.minioService.getSignedUrl(attachment.filePath, 3600); // 1 hour expiry
  }

  async getFilePreviewUrl(id: string, tenantId: string): Promise<string> {
    const attachment = await this.findOne(id, tenantId);
    
    // For images, return direct URL, for others return signed URL
    if (attachment.type === AttachmentType.IMAGE) {
      return this.minioService.getFileUrl(attachment.filePath);
    } else {
      return this.minioService.getSignedUrl(attachment.filePath, 3600);
    }
  }

  async replaceAttachment(
    id: string,
    file: Express.Multer.File,
    tenantId: string,
    description?: string
  ): Promise<Attachment> {
    const attachment = await this.findOne(id, tenantId);

    // Delete old file from MinIO
    try {
      await this.minioService.deleteFile(attachment.filePath);
    } catch (error) {
      console.error(`Failed to delete old file from MinIO: ${attachment.filePath}`, error);
    }

    // Upload new file
    const uploadResult = await this.minioService.uploadFileWithProcessing(
      file,
      `patients/${attachment.patientId}/attachments`
    );

    // Update attachment record
    attachment.fileName = uploadResult.originalName;
    attachment.filePath = uploadResult.urls.original;
    attachment.fileSize = uploadResult.size;
    attachment.type = this.getAttachmentType(file.originalname);
    
    if (description) {
      attachment.description = description;
    }

    return this.repo.save(attachment);
  }

  async getAttachmentStats(tenantId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const total = await this.repo.count({ 
      where: { tenantId, deletedAt: IsNull() } 
    });

    // Get count by type
    const byTypeQuery = await this.repo
      .createQueryBuilder('attachment')
      .select('attachment.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(attachment.fileSize)', 'totalSize')
      .where('attachment.tenantId = :tenantId', { tenantId })
      .andWhere('attachment.deletedAt IS NULL')
      .groupBy('attachment.type')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    const totalSize = byTypeQuery.reduce((sum, item) => {
      return sum + (parseInt(item.totalSize) || 0);
    }, 0);

    return { total, byType, totalSize };
  }

  async getPatientAttachmentStats(patientId: string, tenantId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const total = await this.repo.count({ 
      where: { patientId, tenantId, deletedAt: IsNull() } 
    });

    // Get count by type for this patient
    const byTypeQuery = await this.repo
      .createQueryBuilder('attachment')
      .select('attachment.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(attachment.fileSize)', 'totalSize')
      .where('attachment.patientId = :patientId', { patientId })
      .andWhere('attachment.tenantId = :tenantId', { tenantId })
      .andWhere('attachment.deletedAt IS NULL')
      .groupBy('attachment.type')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    const totalSize = byTypeQuery.reduce((sum, item) => {
      return sum + (parseInt(item.totalSize) || 0);
    }, 0);

    return { total, byType, totalSize };
  }

  private getAttachmentType(filename: string): AttachmentType {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return AttachmentType.IMAGE;
      case 'pdf':
        return AttachmentType.PDF;
      case 'doc':
      case 'docx':
        return AttachmentType.DOC;
      default:
        return AttachmentType.OTHER;
    }
  }
}
