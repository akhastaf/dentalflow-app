import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, LessThanOrEqual, MoreThanOrEqual, ILike } from 'typeorm';
import { StaffTimeRange, TimeRangeStatus } from './entities/staff-time-range.entity';
import { CreateStaffTimeRangeDto } from './dtos/create-staff-time-range.dto';
import { UpdateStaffTimeRangeDto } from './dtos/update-staff-time-range.dto';
import { FilterStaffTimeRangeDto } from './dtos/filter-staff-time-range.dto';
import { StaffService } from './staff.service';

@Injectable()
export class StaffTimeRangeService {
  constructor(
    @InjectRepository(StaffTimeRange)
    private readonly repo: Repository<StaffTimeRange>,
    private readonly staffService: StaffService,
  ) {}

  async create(data: CreateStaffTimeRangeDto, tenantId: string): Promise<StaffTimeRange> {
    // Verify staff exists and belongs to tenant
    await this.staffService.findOne(data.staffId, tenantId);

    // Check for overlapping time ranges
    await this.checkForConflicts(data, tenantId);

    const timeRange = new StaffTimeRange();
    Object.assign(timeRange, {
      ...data,
      tenantId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null,
    });

    return this.repo.save(timeRange);
  }

  async findAll(tenantId: string, filters: FilterStaffTimeRangeDto = {}): Promise<{ timeRanges: StaffTimeRange[]; total: number }> {
    const { 
      staffId, 
      type, 
      status, 
      startDateFrom, 
      startDateTo, 
      endDateFrom, 
      endDateTo, 
      search, 
      page = 1, 
      limit = 10 
    } = filters;
    
    const queryBuilder = this.repo.createQueryBuilder('timeRange')
      .leftJoinAndSelect('timeRange.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('timeRange.tenantId = :tenantId', { tenantId })
      .andWhere('timeRange.deletedAt IS NULL');

    // Apply filters
    if (staffId) {
      queryBuilder.andWhere('timeRange.staffId = :staffId', { staffId });
    }

    if (type) {
      queryBuilder.andWhere('timeRange.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('timeRange.status = :status', { status });
    }

    if (startDateFrom) {
      queryBuilder.andWhere('timeRange.startDate >= :startDateFrom', { startDateFrom });
    }

    if (startDateTo) {
      queryBuilder.andWhere('timeRange.startDate <= :startDateTo', { startDateTo });
    }

    if (endDateFrom) {
      queryBuilder.andWhere('timeRange.endDate >= :endDateFrom', { endDateFrom });
    }

    if (endDateTo) {
      queryBuilder.andWhere('timeRange.endDate <= :endDateTo', { endDateTo });
    }

    if (search) {
      queryBuilder.andWhere(
        '(timeRange.description ILIKE :search OR timeRange.notes ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by start date (newest first)
    queryBuilder.orderBy('timeRange.startDate', 'DESC');

    const [timeRanges, total] = await queryBuilder.getManyAndCount();

    return { timeRanges, total };
  }

  async findOne(id: string, tenantId: string): Promise<StaffTimeRange> {
    const timeRange = await this.repo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['staff', 'staff.user', 'tenant']
    });

    if (!timeRange) {
      throw new NotFoundException('Time range not found');
    }

    return timeRange;
  }

  async update(id: string, updateData: UpdateStaffTimeRangeDto, tenantId: string): Promise<StaffTimeRange> {
    const timeRange = await this.findOne(id, tenantId);

    // Check for conflicts if dates are being updated
    if (updateData.startDate || updateData.endDate || updateData.startTime || updateData.endTime) {
      const checkData = {
        staffId: timeRange.staffId,
        startDate: updateData.startDate || timeRange.startDate.toISOString().split('T')[0],
        endDate: updateData.endDate || timeRange.endDate.toISOString().split('T')[0],
        startTime: updateData.startTime || timeRange.startTime,
        endTime: updateData.endTime || timeRange.endTime,
        isRecurring: updateData.isRecurring ?? timeRange.isRecurring,
        recurringDays: updateData.recurringDays || timeRange.recurringDays,
        recurringEndDate: updateData.recurringEndDate || timeRange.recurringEndDate?.toISOString().split('T')[0],
      };

      await this.checkForConflicts(checkData, tenantId, id);
    }

    // Update the entity
    Object.assign(timeRange, updateData);
    
    if (updateData.startDate) {
      timeRange.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      timeRange.endDate = new Date(updateData.endDate);
    }
    if (updateData.recurringEndDate) {
      timeRange.recurringEndDate = new Date(updateData.recurringEndDate);
    }

    return this.repo.save(timeRange);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const timeRange = await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
  }

  async checkForConflicts(data: any, tenantId: string, excludeId?: string): Promise<void> {
    const { staffId, startDate, endDate, startTime, endTime, isRecurring, recurringDays, recurringEndDate } = data;

    let queryBuilder = this.repo.createQueryBuilder('timeRange')
      .where('timeRange.staffId = :staffId', { staffId })
      .andWhere('timeRange.tenantId = :tenantId', { tenantId })
      .andWhere('timeRange.deletedAt IS NULL')
      .andWhere('timeRange.status = :status', { status: TimeRangeStatus.APPROVED });

    if (excludeId) {
      queryBuilder.andWhere('timeRange.id != :excludeId', { excludeId });
    }

    // For non-recurring time ranges
    if (!isRecurring) {
      queryBuilder.andWhere(
        '(timeRange.startDate <= :endDate AND timeRange.endDate >= :startDate)',
        { startDate, endDate }
      );

      // If times are specified, check for time conflicts
      if (startTime && endTime) {
        queryBuilder.andWhere(
          '(timeRange.startTime IS NULL OR timeRange.endTime IS NULL OR ' +
          '(timeRange.startTime < :endTime AND timeRange.endTime > :startTime))',
          { startTime, endTime }
        );
      }
    } else {
      // For recurring time ranges, check if there's any overlap in the recurring pattern
      if (recurringDays && recurringEndDate) {
        // This is a simplified check - in a real implementation, you'd need more complex logic
        // to check for overlapping recurring patterns
        queryBuilder.andWhere(
          '(timeRange.startDate <= :recurringEndDate AND timeRange.endDate >= :startDate)',
          { startDate, recurringEndDate }
        );
      }
    }

    const conflicts = await queryBuilder.getMany();

    if (conflicts.length > 0) {
      throw new ConflictException('Time range conflicts with existing schedule');
    }
  }

  async getStaffAvailability(staffId: string, tenantId: string, startDate: string, endDate: string): Promise<{
    available: boolean;
    conflicts: StaffTimeRange[];
    workingDays: number[];
  }> {
    // Get staff working days
    const staff = await this.staffService.findOne(staffId, tenantId);
    
    // Get all time ranges for the staff in the date range
    const timeRanges = await this.repo.find({
      where: {
        staffId,
        tenantId,
        deletedAt: IsNull(),
        status: TimeRangeStatus.APPROVED,
        startDate: MoreThanOrEqual(new Date(startDate)),
        endDate: LessThanOrEqual(new Date(endDate))
      }
    });

    // Check if the date range conflicts with any time ranges
    const conflicts = timeRanges.filter(tr => {
      const trStart = new Date(tr.startDate);
      const trEnd = new Date(tr.endDate);
      const checkStart = new Date(startDate);
      const checkEnd = new Date(endDate);

      return (trStart <= checkEnd && trEnd >= checkStart);
    });

    return {
      available: conflicts.length === 0,
      conflicts,
      workingDays: staff.workingDays
    };
  }

  async getStaffTimeRangesByStaffId(staffId: string, tenantId: string, filters: FilterStaffTimeRangeDto = {}): Promise<{
    timeRanges: StaffTimeRange[];
    total: number;
  }> {
    const queryBuilder = this.repo.createQueryBuilder('timeRange')
      .leftJoinAndSelect('timeRange.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('timeRange.staffId = :staffId', { staffId })
      .andWhere('timeRange.tenantId = :tenantId', { tenantId })
      .andWhere('timeRange.deletedAt IS NULL');

    // Apply additional filters
    const { type, status, startDateFrom, startDateTo, endDateFrom, endDateTo, page = 1, limit = 10 } = filters;

    if (type) {
      queryBuilder.andWhere('timeRange.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('timeRange.status = :status', { status });
    }

    if (startDateFrom) {
      queryBuilder.andWhere('timeRange.startDate >= :startDateFrom', { startDateFrom });
    }

    if (startDateTo) {
      queryBuilder.andWhere('timeRange.startDate <= :startDateTo', { startDateTo });
    }

    if (endDateFrom) {
      queryBuilder.andWhere('timeRange.endDate >= :endDateFrom', { endDateFrom });
    }

    if (endDateTo) {
      queryBuilder.andWhere('timeRange.endDate <= :endDateTo', { endDateTo });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by start date (newest first)
    queryBuilder.orderBy('timeRange.startDate', 'DESC');

    const [timeRanges, total] = await queryBuilder.getManyAndCount();

    return { timeRanges, total };
  }

  async approveTimeRange(id: string, tenantId: string): Promise<StaffTimeRange> {
    const timeRange = await this.findOne(id, tenantId);
    timeRange.status = TimeRangeStatus.APPROVED;
    return this.repo.save(timeRange);
  }

  async rejectTimeRange(id: string, tenantId: string, reason?: string): Promise<StaffTimeRange> {
    const timeRange = await this.findOne(id, tenantId);
    timeRange.status = TimeRangeStatus.REJECTED;
    if (reason) {
      timeRange.notes = timeRange.notes ? `${timeRange.notes}\nRejection reason: ${reason}` : `Rejection reason: ${reason}`;
    }
    return this.repo.save(timeRange);
  }

  async cancelTimeRange(id: string, tenantId: string): Promise<StaffTimeRange> {
    const timeRange = await this.findOne(id, tenantId);
    timeRange.status = TimeRangeStatus.CANCELLED;
    return this.repo.save(timeRange);
  }
} 