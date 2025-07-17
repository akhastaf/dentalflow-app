import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, IsNull, Not } from 'typeorm';
import { Patient, Gender } from './entities/patient.entity';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { FilterPatientDto } from './dtos/filter-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly repo: Repository<Patient>,
  ) {}

  async findByPhoneAndTenant(phone: string, tenantId: string): Promise<Patient | undefined> {
    const result = await this.repo.findOne({ 
      where: { phone, tenantId, deletedAt: IsNull() }
    });
    return result || undefined;
  }

  async create(data: CreatePatientDto, tenantId: string): Promise<Patient> {
    // Check if patient with same phone already exists in this tenant (including deleted ones)
    const existingPatient = await this.repo.findOne({ 
      where: { phone: data.phone, tenantId } 
    });
    
    if (existingPatient) {
      if (existingPatient.deletedAt) {
        // If patient was soft deleted, restore it with new data
        Object.assign(existingPatient, data);
        existingPatient.deletedAt = undefined;
        return this.repo.save(existingPatient);
      } else {
        throw new ConflictException('Patient with this phone number already exists in this clinic');
      }
    }

    const patient = this.repo.create({
      ...data,
      tenantId,
    });
    return this.repo.save(patient);
  }

  async findAll(tenantId: string, filters: FilterPatientDto = {}): Promise<{ patients: Patient[]; total: number }> {
    const { search, phone, email, gender, page = 1, limit = 10 } = filters;
    
    const queryBuilder = this.repo.createQueryBuilder('patient')
      .where('patient.tenantId = :tenantId', { tenantId })
      .andWhere('patient.deletedAt IS NULL');

    // Apply search filters
    if (search) {
      queryBuilder.andWhere(
        '(patient.fullName ILIKE :search OR patient.phone ILIKE :search OR patient.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (phone) {
      queryBuilder.andWhere('patient.phone ILIKE :phone', { phone: `%${phone}%` });
    }

    if (email) {
      queryBuilder.andWhere('patient.email ILIKE :email', { email: `%${email}%` });
    }

    if (gender) {
      queryBuilder.andWhere('patient.gender = :gender', { gender });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('patient.createdAt', 'DESC');

    const [patients, total] = await queryBuilder.getManyAndCount();

    return { patients, total };
  }

  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.repo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['appointments', 'documents', 'attachments', 'treatments']
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, tenantId: string): Promise<Patient> {
    const patient = await this.findOne(id, tenantId);

    // If phone is being updated, check for conflicts
    if (updatePatientDto.phone && updatePatientDto.phone !== patient.phone) {
      const existingPatient = await this.repo.findOne({ 
        where: { phone: updatePatientDto.phone, tenantId, deletedAt: IsNull() }
      });
      if (existingPatient && existingPatient.id !== id) {
        throw new ConflictException('Patient with this phone number already exists in this clinic');
      }
    }

    Object.assign(patient, updatePatientDto);
    return this.repo.save(patient);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const patient = await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
  }

  // New methods for soft delete management

  async getDeletedPatients(tenantId: string, page: number = 1, limit: number = 10): Promise<{ patients: Patient[]; total: number }> {
    const queryBuilder = this.repo.createQueryBuilder('patient')
      .where('patient.tenantId = :tenantId', { tenantId })
      .andWhere('patient.deletedAt IS NOT NULL');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by deletion date (most recently deleted first)
    queryBuilder.orderBy('patient.deletedAt', 'DESC');

    const [patients, total] = await queryBuilder.getManyAndCount();

    return { patients, total };
  }

  async restorePatient(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.repo.findOne({
      where: { id, tenantId, deletedAt: Not(IsNull()) }
    });

    if (!patient) {
      throw new NotFoundException('Deleted patient not found');
    }

    // Check if there's already an active patient with the same phone
    const activePatient = await this.repo.findOne({
      where: { phone: patient.phone, tenantId, deletedAt: IsNull() }
    });

    if (activePatient) {
      throw new ConflictException('Cannot restore patient: an active patient with the same phone number already exists');
    }

    patient.deletedAt = undefined;
    return this.repo.save(patient);
  }

  async permanentlyDelete(id: string, tenantId: string): Promise<void> {
    const patient = await this.repo.findOne({
      where: { id, tenantId }
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    await this.repo.remove(patient);
  }

  async getPatientStats(tenantId: string): Promise<{
    total: number;
    male: number;
    female: number;
    thisMonth: number;
    deleted: number;
  }> {
    const total = await this.repo.count({ where: { tenantId, deletedAt: IsNull() } });
    
    const male = await this.repo.count({ 
      where: { tenantId, gender: Gender.MALE, deletedAt: IsNull() } 
    });
    
    const female = await this.repo.count({ 
      where: { tenantId, gender: Gender.FEMALE, deletedAt: IsNull() } 
    });

    const thisMonth = await this.repo.count({
      where: {
        tenantId,
        deletedAt: IsNull(),
        createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const deleted = await this.repo.count({
      where: { tenantId, deletedAt: Not(IsNull()) }
    });

    return { total, male, female, thisMonth, deleted };
  }

  async getPatientByIdIncludingDeleted(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['appointments', 'documents', 'attachments', 'treatments']
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async findById(id: string): Promise<Patient | undefined> {
    const patient = await this.repo.findOne({ where: { id } });
    return patient || undefined;
  }
}
