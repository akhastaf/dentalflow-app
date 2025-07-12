import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { FilterDocumentDto } from './dtos/filter-document.dto';
import { Staff } from '../staff/entities/staff.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  async create(data: CreateDocumentDto, currentUser: User): Promise<Document> {
    // Get the user's staff record to get the tenant
    const staff = await this.staffRepo.findOne({
      where: { userId: currentUser.user_id, deletedAt: IsNull() },
      select: ['id', 'tenantId']
    });

    if (!staff) {
      throw new NotFoundException('User is not associated with any tenant');
    }

    // Create document with tenant from user's staff relationship
    const doc = this.repo.create({
      patientId: data.patientId,
      type: data.type,
      title: data.title,
      description: data.description,
      assignedDoctorId: data.assignedDoctorId,
      fileUrl: data.fileUrl,
      data: data.data,
      tenantId: staff.tenantId,
      createdById: currentUser.user_id
    });
    
    return this.repo.save(doc);
  }

  async findAll(filters: FilterDocumentDto = {}, currentUser?: User): Promise<{ documents: Document[]; total: number }> {
    const { patientId, type, search, page = 1, limit = 10 } = filters;
    const query = this.repo.createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .leftJoinAndSelect('document.assignedDoctor', 'assignedDoctor')
      .where('document.deletedAt IS NULL');

    // Filter by tenant if user is provided
    if (currentUser) {
      const staff = await this.staffRepo.findOne({
        where: { userId: currentUser.user_id, deletedAt: IsNull() },
        select: ['tenantId']
      });
      
      if (staff) {
        query.andWhere('document.tenantId = :tenantId', { tenantId: staff.tenantId });
      }
    }

    if (patientId) {
      query.andWhere('document.patientId = :patientId', { patientId });
    }
    if (type) {
      query.andWhere('document.type = :type', { type });
    }
    if (search) {
      query.andWhere('(document.title ILIKE :search OR document.description ILIKE :search)', { search: `%${search}%` });
    }
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    query.orderBy('document.createdAt', 'DESC');
    const [documents, total] = await query.getManyAndCount();
    return { documents, total };
  }

  async findOne(id: string, currentUser?: User): Promise<Document> {
    const query = this.repo.createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .leftJoinAndSelect('document.assignedDoctor', 'assignedDoctor')
      .where('document.id = :id', { id })
      .andWhere('document.deletedAt IS NULL');

    // Filter by tenant if user is provided
    if (currentUser) {
      const staff = await this.staffRepo.findOne({
        where: { userId: currentUser.user_id, deletedAt: IsNull() },
        select: ['tenantId']
      });
      
      if (staff) {
        query.andWhere('document.tenantId = :tenantId', { tenantId: staff.tenantId });
      }
    }

    const doc = await query.getOne();
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    const doc = await this.findOne(id);
    Object.assign(doc, dto);
    return this.repo.save(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
