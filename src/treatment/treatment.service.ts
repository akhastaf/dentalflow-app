import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Treatment, TreatmentStatus, TreatmentPriority, TreatmentPhase } from './entities/tratment.entity';
import { TreatmentPlan, TreatmentPlanStatus } from './entities/treatment-plan.entity';
import { TenantTreatment } from './entities/tenant-treatment.entity';
import { CreateTreatmentDto } from './dtos/create-treatment.dto';
import { UpdateTreatmentDto } from './dtos/update-treatment.dto';
import { FilterTreatmentDto } from './dtos/filter-treatment.dto';
import { CreateTreatmentPlanDto } from './dtos/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dtos/update-treatment-plan.dto';

export interface TreatmentStatistics {
  totalTreatments: number;
  completedTreatments: number;
  inProgressTreatments: number;
  plannedTreatments: number;
  cancelledTreatments: number;
  totalRevenue: number;
  totalPaid: number;
  averageProgress: number;
  treatmentsByStatus: Record<TreatmentStatus, number>;
  treatmentsByPriority: Record<TreatmentPriority, number>;
  treatmentsByPhase: Record<TreatmentPhase, number>;
}

export interface TreatmentPlanStatistics {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  draftPlans: number;
  totalRevenue: number;
  averageProgress: number;
  plansByStatus: Record<TreatmentPlanStatus, number>;
}

@Injectable()
export class TreatmentService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepo: Repository<Treatment>,
    @InjectRepository(TreatmentPlan)
    private readonly treatmentPlanRepo: Repository<TreatmentPlan>,
    @InjectRepository(TenantTreatment)
    private readonly tenantTreatmentRepo: Repository<TenantTreatment>,
  ) {}

  // Treatment CRUD Operations
  async create(createTreatmentDto: CreateTreatmentDto, tenantId: string): Promise<Treatment> {
    const treatment = this.treatmentRepo.create({
      ...createTreatmentDto,
      tenantId,
    });

    // Calculate final amount with discounts
    if (createTreatmentDto.discountPercentage) {
      treatment.discountAmount = (treatment.amount * createTreatmentDto.discountPercentage) / 100;
      treatment.amount = treatment.amount - treatment.discountAmount;
    }

    return this.treatmentRepo.save(treatment);
  }

  async findAll(filterDto: FilterTreatmentDto, tenantId: string): Promise<{ treatments: Treatment[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', ...filters } = filterDto;

    const queryBuilder = this.treatmentRepo.createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.patient', 'patient')
      .leftJoinAndSelect('treatment.doctor', 'doctor')
      .leftJoinAndSelect('treatment.tenantTreatment', 'tenantTreatment')
      .leftJoinAndSelect('treatment.treatmentPlan', 'treatmentPlan')
      .where('treatment.tenantId = :tenantId', { tenantId })
      .andWhere('treatment.deletedAt IS NULL');

    // Apply filters
    if (filters.patientId) {
      queryBuilder.andWhere('treatment.patientId = :patientId', { patientId: filters.patientId });
    }

    if (filters.doctorId) {
      queryBuilder.andWhere('treatment.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    if (filters.treatmentPlanId) {
      queryBuilder.andWhere('treatment.treatmentPlanId = :treatmentPlanId', { treatmentPlanId: filters.treatmentPlanId });
    }

    if (filters.tenantTreatmentId) {
      queryBuilder.andWhere('treatment.tenantTreatmentId = :tenantTreatmentId', { tenantTreatmentId: filters.tenantTreatmentId });
    }

    if (filters.status) {
      queryBuilder.andWhere('treatment.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      queryBuilder.andWhere('treatment.priority = :priority', { priority: filters.priority });
    }

    if (filters.phase) {
      queryBuilder.andWhere('treatment.phase = :phase', { phase: filters.phase });
    }

    if (filters.toothNumber) {
      queryBuilder.andWhere('treatment.toothNumber = :toothNumber', { toothNumber: filters.toothNumber });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(treatment.diagnosis ILIKE :search OR treatment.clinicalNotes ILIKE :search OR treatment.note ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('treatment.plannedDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('treatment.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('treatment.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.minProgress !== undefined) {
      queryBuilder.andWhere('treatment.progressPercentage >= :minProgress', { minProgress: filters.minProgress });
    }

    if (filters.maxProgress !== undefined) {
      queryBuilder.andWhere('treatment.progressPercentage <= :maxProgress', { maxProgress: filters.maxProgress });
    }

    if (filters.includeCompleted === false) {
      queryBuilder.andWhere('treatment.status != :completedStatus', { completedStatus: TreatmentStatus.COMPLETED });
    }

    if (filters.includeCancelled === false) {
      queryBuilder.andWhere('treatment.status != :cancelledStatus', { cancelledStatus: TreatmentStatus.CANCELLED });
    }

    // Apply sorting
    queryBuilder.orderBy(`treatment.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [treatments, total] = await queryBuilder.getManyAndCount();

    return { treatments, total };
  }

  async findOne(id: string, tenantId: string): Promise<Treatment> {
    const treatment = await this.treatmentRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['patient', 'doctor', 'tenantTreatment', 'treatmentPlan', 'parentTreatment', 'childTreatments'],
    });

    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }

    return treatment;
  }

  async update(id: string, updateTreatmentDto: UpdateTreatmentDto, tenantId: string): Promise<Treatment> {
    const treatment = await this.findOne(id, tenantId);

    // Handle status changes
    if (updateTreatmentDto.status === TreatmentStatus.COMPLETED && treatment.status !== TreatmentStatus.COMPLETED) {
      treatment.completedDate = new Date();
      treatment.progressPercentage = 100;
    }

    // Recalculate amount if discount percentage changes
    if (updateTreatmentDto.discountPercentage !== undefined) {
      const originalAmount = treatment.amount + treatment.discountAmount;
      updateTreatmentDto.discountAmount = (originalAmount * updateTreatmentDto.discountPercentage) / 100;
      updateTreatmentDto.amount = originalAmount - updateTreatmentDto.discountAmount;
    }

    Object.assign(treatment, updateTreatmentDto);
    return this.treatmentRepo.save(treatment);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const treatment = await this.findOne(id, tenantId);
    await this.treatmentRepo.softDelete(id);
  }

  // Treatment Plan Operations
  async createTreatmentPlan(createPlanDto: CreateTreatmentPlanDto, tenantId: string): Promise<TreatmentPlan> {
    const treatmentPlan = this.treatmentPlanRepo.create({
      ...createPlanDto,
      tenantId,
    });

    return this.treatmentPlanRepo.save(treatmentPlan);
  }

  async findAllTreatmentPlans(tenantId: string, patientId?: string): Promise<TreatmentPlan[]> {
    const queryBuilder = this.treatmentPlanRepo.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.patient', 'patient')
      .leftJoinAndSelect('plan.doctor', 'doctor')
      .leftJoinAndSelect('plan.treatments', 'treatments')
      .where('plan.tenantId = :tenantId', { tenantId })
      .andWhere('plan.deletedAt IS NULL');

    if (patientId) {
      queryBuilder.andWhere('plan.patientId = :patientId', { patientId });
    }

    return queryBuilder.getMany();
  }

  async findOneTreatmentPlan(id: string, tenantId: string): Promise<TreatmentPlan> {
    const plan = await this.treatmentPlanRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['patient', 'doctor', 'treatments', 'treatments.tenantTreatment'],
    });

    if (!plan) {
      throw new NotFoundException(`Treatment plan with ID ${id} not found`);
    }

    return plan;
  }

  async updateTreatmentPlan(id: string, updatePlanDto: UpdateTreatmentPlanDto, tenantId: string): Promise<TreatmentPlan> {
    const plan = await this.findOneTreatmentPlan(id, tenantId);

    // Update progress based on treatments
    if (plan.treatments && plan.treatments.length > 0) {
      const completedCount = plan.treatments.filter(t => t.status === TreatmentStatus.COMPLETED).length;
      const totalCount = plan.treatments.length;
      plan.completedTreatmentsCount = completedCount;
      plan.totalTreatmentsCount = totalCount;
      plan.progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Update financial totals
      plan.totalAmount = plan.treatments.reduce((sum, t) => sum + Number(t.amount), 0);
      plan.totalAmountPaid = plan.treatments.reduce((sum, t) => sum + Number(t.amountPaid), 0);
      plan.totalDiscountAmount = plan.treatments.reduce((sum, t) => sum + Number(t.discountAmount), 0);
    }

    Object.assign(plan, updatePlanDto);
    return this.treatmentPlanRepo.save(plan);
  }

  async removeTreatmentPlan(id: string, tenantId: string): Promise<void> {
    const plan = await this.findOneTreatmentPlan(id, tenantId);
    await this.treatmentPlanRepo.softDelete(id);
  }

  // Statistics and Analytics
  async getTreatmentStatistics(tenantId: string, startDate?: string, endDate?: string): Promise<TreatmentStatistics> {
    const queryBuilder = this.treatmentRepo.createQueryBuilder('treatment')
      .where('treatment.tenantId = :tenantId', { tenantId })
      .andWhere('treatment.deletedAt IS NULL');

    if (startDate && endDate) {
      queryBuilder.andWhere('treatment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const treatments = await queryBuilder.getMany();

    const statistics: TreatmentStatistics = {
      totalTreatments: treatments.length,
      completedTreatments: treatments.filter(t => t.status === TreatmentStatus.COMPLETED).length,
      inProgressTreatments: treatments.filter(t => t.status === TreatmentStatus.IN_PROGRESS).length,
      plannedTreatments: treatments.filter(t => t.status === TreatmentStatus.PLANNED).length,
      cancelledTreatments: treatments.filter(t => t.status === TreatmentStatus.CANCELLED).length,
      totalRevenue: treatments.reduce((sum, t) => sum + Number(t.amount), 0),
      totalPaid: treatments.reduce((sum, t) => sum + Number(t.amountPaid), 0),
      averageProgress: treatments.length > 0 ? treatments.reduce((sum, t) => sum + t.progressPercentage, 0) / treatments.length : 0,
      treatmentsByStatus: {} as Record<TreatmentStatus, number>,
      treatmentsByPriority: {} as Record<TreatmentPriority, number>,
      treatmentsByPhase: {} as Record<TreatmentPhase, number>,
    };

    // Calculate by status
    Object.values(TreatmentStatus).forEach(status => {
      statistics.treatmentsByStatus[status] = treatments.filter(t => t.status === status).length;
    });

    // Calculate by priority
    Object.values(TreatmentPriority).forEach(priority => {
      statistics.treatmentsByPriority[priority] = treatments.filter(t => t.priority === priority).length;
    });

    // Calculate by phase
    Object.values(TreatmentPhase).forEach(phase => {
      statistics.treatmentsByPhase[phase] = treatments.filter(t => t.phase === phase).length;
    });

    return statistics;
  }

  async getTreatmentPlanStatistics(tenantId: string): Promise<TreatmentPlanStatistics> {
    const plans = await this.treatmentPlanRepo.find({
      where: { tenantId, deletedAt: IsNull() },
      relations: ['treatments'],
    });

    const statistics: TreatmentPlanStatistics = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === TreatmentPlanStatus.ACTIVE).length,
      completedPlans: plans.filter(p => p.status === TreatmentPlanStatus.COMPLETED).length,
      draftPlans: plans.filter(p => p.status === TreatmentPlanStatus.DRAFT).length,
      totalRevenue: plans.reduce((sum, p) => sum + Number(p.totalAmount), 0),
      averageProgress: plans.length > 0 ? plans.reduce((sum, p) => sum + p.progressPercentage, 0) / plans.length : 0,
      plansByStatus: {} as Record<TreatmentPlanStatus, number>,
    };

    // Calculate by status
    Object.values(TreatmentPlanStatus).forEach(status => {
      statistics.plansByStatus[status] = plans.filter(p => p.status === status).length;
    });

    return statistics;
  }

  // Advanced Features
  async updateTreatmentProgress(id: string, progressPercentage: number, tenantId: string, progressNotes?: string): Promise<Treatment> {
    const treatment = await this.findOne(id, tenantId);

    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new BadRequestException('Progress percentage must be between 0 and 100');
    }

    treatment.progressPercentage = progressPercentage;
    treatment.progressNotes = progressNotes;

    // Auto-update status based on progress
    if (progressPercentage === 100) {
      treatment.status = TreatmentStatus.COMPLETED;
      treatment.completedDate = new Date();
    } else if (progressPercentage > 0) {
      treatment.status = TreatmentStatus.IN_PROGRESS;
    }

    return this.treatmentRepo.save(treatment);
  }

  async getPatientTreatments(patientId: string, tenantId: string): Promise<{ treatments: Treatment[]; plans: TreatmentPlan[] }> {
    const [treatments, plans] = await Promise.all([
      this.treatmentRepo.find({
        where: { patientId, tenantId, deletedAt: IsNull() },
        relations: ['tenantTreatment', 'treatmentPlan'],
        order: { createdAt: 'DESC' },
      }),
      this.treatmentPlanRepo.find({
        where: { patientId, tenantId, deletedAt: IsNull() },
        relations: ['treatments'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return { treatments, plans };
  }

  async getUpcomingTreatments(tenantId: string, days: number = 30): Promise<Treatment[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.treatmentRepo.find({
      where: {
        tenantId,
        deletedAt: IsNull(),
        plannedDate: Between(startDate, endDate),
        status: TreatmentStatus.PLANNED,
      },
      relations: ['patient', 'doctor', 'tenantTreatment'],
      order: { plannedDate: 'ASC' },
    });
  }

  async getOverdueTreatments(tenantId: string): Promise<Treatment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.treatmentRepo.find({
      where: {
        tenantId,
        deletedAt: IsNull(),
        plannedDate: LessThanOrEqual(today),
        status: TreatmentStatus.PLANNED,
      },
      relations: ['patient', 'doctor', 'tenantTreatment'],
      order: { plannedDate: 'ASC' },
    });
  }
}
