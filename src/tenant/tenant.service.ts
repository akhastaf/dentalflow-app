import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Tenant, SubscriptionPlan, Language } from './entities/tenant.entity';
import { UpdateTenantProfileDto } from './dtos/update-tenant-profile.dto';
import { UpdateTenantSettingsDto } from './dtos/update-tenant-settings.dto';
import { TenantStatsDto } from './dtos/tenant-stats.dto';
import { Staff } from '../staff/entities/staff.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { Payment } from '../payment/entities/payment.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(tenantData: {
    name: string;
    slug: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    ownerUserId: string;
  }): Promise<Tenant> {
    // Check if tenant with same slug or name already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: [
        { slug: tenantData.slug },
        { name: tenantData.name },
        { email: tenantData.email }
      ]
    });

    if (existingTenant) {
      throw new ConflictException('A clinic with this name, slug, or email already exists');
    }

    const tenant = this.tenantRepository.create({
      ...tenantData,
      subscriptionPlan: SubscriptionPlan.FREE,
      isActive: true,
      language: Language.FR,
      timezone: 'Africa/Casablanca',
    });

    return this.tenantRepository.save(tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { id },
      relations: ['owner']
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { slug },
      relations: ['owner']
    });
  }

  /**
   * Get tenant by user's staff relationship
   */
  async findByUserId(userId: string): Promise<Tenant | null> {
    const staff = await this.staffRepository.findOne({
      where: { userId, deletedAt: IsNull() },
      relations: ['tenant']
    });
    
    return staff?.tenant || null;
  }

  /**
   * Update tenant profile information
   */
  async updateProfile(tenantId: string, updateData: UpdateTenantProfileDto): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check for conflicts if updating unique fields
    if (updateData.name && updateData.name !== tenant.name) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { name: updateData.name, id: tenantId }
      });
      if (existingTenant) {
        throw new ConflictException('A clinic with this name already exists');
      }
    }

    if (updateData.email && updateData.email !== tenant.email) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { email: updateData.email, id: tenantId }
      });
      if (existingTenant) {
        throw new ConflictException('A clinic with this email already exists');
      }
    }

    Object.assign(tenant, updateData);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant settings
   */
  async updateSettings(tenantId: string, updateData: UpdateTenantSettingsDto): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    Object.assign(tenant, updateData);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Get tenant statistics
   */
  async getStats(tenantId: string): Promise<TenantStatsDto> {
    const tenant = await this.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count patients
    const totalPatients = await this.patientRepository.count({
      where: { tenantId, deletedAt: IsNull() }
    });

    // Count appointments
    const totalAppointments = await this.appointmentRepository.count({
      where: { tenantId, deletedAt: IsNull() }
    });

    const appointmentsThisMonth = await this.appointmentRepository.count({
      where: { 
        tenantId, 
        deletedAt: IsNull(),
        createdAt: startOfMonth
      }
    });

    // Count staff
    const activeStaff = await this.staffRepository.count({
      where: { tenantId, deletedAt: IsNull() }
    });

    // Count pending appointments
    const pendingAppointments = await this.appointmentRepository.count({
      where: { 
        tenantId, 
        deletedAt: IsNull(),
        status: 'pending'
      }
    });

    // Count today's appointments
    const completedToday = await this.appointmentRepository.count({
      where: { 
        tenantId, 
        deletedAt: IsNull(),
        status: 'finished',
        date: startOfDay.toISOString().split('T')[0]
      }
    });

    const upcomingToday = await this.appointmentRepository.count({
      where: { 
        tenantId, 
        deletedAt: IsNull(),
        status: 'confirmed',
        date: startOfDay.toISOString().split('T')[0]
      }
    });

    // Calculate revenue (you'll need to implement this based on your payment structure)
    const totalRevenue = await this.calculateTotalRevenue(tenantId);
    const revenueThisMonth = await this.calculateMonthlyRevenue(tenantId, startOfMonth);

    return {
      totalPatients,
      totalAppointments,
      appointmentsThisMonth,
      totalRevenue,
      revenueThisMonth,
      activeStaff,
      pendingAppointments,
      completedToday,
      upcomingToday
    };
  }

  /**
   * Calculate total revenue for tenant
   */
  private async calculateTotalRevenue(tenantId: string): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.appointment', 'appointment')
      .where('appointment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Calculate monthly revenue for tenant
   */
  private async calculateMonthlyRevenue(tenantId: string, startOfMonth: Date): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.appointment', 'appointment')
      .where('appointment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .andWhere('payment.createdAt >= :startOfMonth', { startOfMonth })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}
