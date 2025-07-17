import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dtos/create-staff.dto';
import { CreateStaffWithUserDto } from './dtos/create-staff-with-user.dto';
import { UpdateStaffDto } from './dtos/update-staff.dto';
import { FilterStaffDto } from './dtos/filter-staff.dto';
import { UserService } from '../user/users.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly repo: Repository<Staff>,
    private readonly userService: UserService,
  ) {}

  async findByUserId(userId: string): Promise<Staff> {
    const staff = await this.repo.findOne({
      where: { userId, deletedAt: IsNull() },
      relations: ['tenant', 'user']
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async getTenantIdByUserId(userId: string): Promise<string> {
    const staff = await this.findByUserId(userId);
    return staff.tenantId;
  }

  async findByTenantId(tenantId: string): Promise<Staff[]> {
    return this.repo.find({
      where: { tenantId, deletedAt: IsNull() },
      relations: ['user', 'tenant']
    });
  }

  async create(data: CreateStaffDto, tenantId: string): Promise<Staff> {
    // Check if user is already staff in this tenant
    const existingStaff = await this.repo.findOne({
      where: { userId: data.userId, tenantId, deletedAt: IsNull() }
    });

    if (existingStaff) {
      throw new ConflictException('User is already a staff member in this clinic');
    }

    const staff = this.repo.create({
      ...data,
      tenantId,
    });

    return this.repo.save(staff);
  }

  async createWithUser(data: CreateStaffWithUserDto, tenantId: string): Promise<{ staff: Staff; user: any }> {
    // Check if user with this email already exists
    try {
      const existingUser = await this.userService.getUserByEmail(data.email);
      throw new ConflictException('User with this email already exists');
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // User doesn't exist, continue with creation
    }

    // Create user first
    const userData = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: '',
    };

    const user = await this.userService.createWithBasicData(userData);
    if (!user) {
      throw new ConflictException('Failed to create user account');
    }

    // Create staff record
    const staffData = {
      userId: user.user_id,
      role: data.role,
      workingDays: data.workingDays,
      salaryType: data.salaryType,
      salaryAmount: data.salaryAmount,
      customPermissions: data.customPermissions,
    };

    const staff = await this.create(staffData, tenantId);

    return { staff, user };
  }

  async findAll(tenantId: string, filters: FilterStaffDto = {}): Promise<{ staff: Staff[]; total: number }> {
    const { search, role, page = 1, limit = 10 } = filters;
    
    const queryBuilder = this.repo.createQueryBuilder('staff')
      .leftJoinAndSelect('staff.user', 'user')
      .leftJoinAndSelect('staff.tenant', 'tenant')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL');

    // Apply search filters
    if (search) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere('staff.role = :role', { role });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('staff.createdAt', 'DESC');

    const [staff, total] = await queryBuilder.getManyAndCount();

    return { staff, total };
  }

  async findOne(id: string, tenantId: string): Promise<Staff> {
    const staff = await this.repo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['user', 'tenant']
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto, tenantId: string): Promise<Staff> {
    const staff = await this.findOne(id, tenantId);

    // If userId is being updated, check for conflicts
    if (updateStaffDto.userId && updateStaffDto.userId !== staff.userId) {
      const existingStaff = await this.repo.findOne({
        where: { userId: updateStaffDto.userId, tenantId, deletedAt: IsNull() }
      });
      if (existingStaff && existingStaff.id !== id) {
        throw new ConflictException('User is already a staff member in this clinic');
      }
    }

    Object.assign(staff, updateStaffDto);
    return this.repo.save(staff);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const staff = await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
  }

  async getStaffStats(tenantId: string): Promise<{
    total: number;
    byRole: Record<string, number>;
  }> {
    const total = await this.repo.count({ 
      where: { tenantId, deletedAt: IsNull() } 
    });

    // Get count by role
    const byRoleQuery = await this.repo
      .createQueryBuilder('staff')
      .select('staff.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL')
      .groupBy('staff.role')
      .getRawMany();

    const byRole = byRoleQuery.reduce((acc, item) => {
      acc[item.role] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    return { total, byRole };
  }

  async findByUserIdAndTenant(userId: string, tenantId: string): Promise<Staff | null> {
    return this.repo.findOne({
      where: { userId, tenantId, deletedAt: IsNull() },
      relations: ['user', 'tenant']
    });
  }

  async getDeletedStaff(tenantId: string, page: number = 1, limit: number = 10): Promise<{ staff: Staff[]; total: number }> {
    const queryBuilder = this.repo.createQueryBuilder('staff')
      .leftJoinAndSelect('staff.user', 'user')
      .leftJoinAndSelect('staff.tenant', 'tenant')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NOT NULL');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by deletion date (most recently deleted first)
    queryBuilder.orderBy('staff.deletedAt', 'DESC');

    const [staff, total] = await queryBuilder.getManyAndCount();

    return { staff, total };
  }

  async restoreStaff(id: string, tenantId: string): Promise<Staff> {
    const staff = await this.repo.findOne({
      where: { id, tenantId, deletedAt: IsNull() }
    });

    if (!staff) {
      throw new NotFoundException('Deleted staff member not found');
    }

    staff.deletedAt = undefined;
    return this.repo.save(staff);
  }

  async permanentlyDelete(id: string, tenantId: string): Promise<void> {
    const staff = await this.repo.findOne({
      where: { id, tenantId }
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.repo.remove(staff);
  }
}
