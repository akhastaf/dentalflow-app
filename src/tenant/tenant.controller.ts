import { Controller, Post, Param, Body, NotFoundException, BadRequestException, Get, Patch, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PublicBookAppointmentDto } from './dtos/public-book-appointment.dto';
import { UpdateTenantProfileDto } from './dtos/update-tenant-profile.dto';
import { UpdateTenantSettingsDto } from './dtos/update-tenant-settings.dto';
import { TenantStatsDto } from './dtos/tenant-stats.dto';
import { PatientService } from '../patient/patient.service';
import { AppointmentService } from '../appointment/appointment.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Patient } from '../patient/entities/patient.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { AppointmentStatus, AppointmentStatus as AppointmentStatusEnum } from '../appointment/dtos/create-appointment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Tenant } from './entities/tenant.entity';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
  ) {}

  // ===== REGULAR TENANT OPERATIONS =====

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant profile' })
  @ApiResponse({ status: 200, type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getProfile(@CurrentUser() currentUser: User): Promise<Tenant> {
    const tenant = await this.tenantService.findByUserId(currentUser.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant profile' })
  @ApiResponse({ status: 200, type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Name or email already exists' })
  async updateProfile(
    @CurrentUser() currentUser: User,
    @Body() updateData: UpdateTenantProfileDto
  ): Promise<Tenant> {
    const tenant = await this.tenantService.findByUserId(currentUser.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return this.tenantService.updateProfile(tenant.id, updateData);
  }

  @Patch('settings')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiResponse({ status: 200, type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateSettings(
    @CurrentUser() currentUser: User,
    @Body() updateData: UpdateTenantSettingsDto
  ): Promise<Tenant> {
    const tenant = await this.tenantService.findByUserId(currentUser.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return this.tenantService.updateSettings(tenant.id, updateData);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({ status: 200, type: TenantStatsDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getStats(@CurrentUser() currentUser: User): Promise<TenantStatsDto> {
    const tenant = await this.tenantService.findByUserId(currentUser.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return this.tenantService.getStats(tenant.id);
  }

  // ===== PUBLIC TENANT OPERATIONS =====

  @Get(':slug')
  @ApiOperation({ summary: 'Get public tenant information' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiResponse({ status: 200, type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getPublicTenant(@Param('slug') slug: string): Promise<Tenant> {
    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  @Get(':slug/doctors')
  @ApiOperation({ summary: 'Get available doctors for booking' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiResponse({ status: 200, description: 'List of available doctors' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getAvailableDoctors(@Param('slug') slug: string) {
    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found');
    }
    
    // This would need to be implemented in the staff service
    // For now, returning a placeholder
    return {
      tenantId: tenant.id,
      doctors: [] // TODO: Implement staff service method to get available doctors
    };
  }

  @Post(':tenantId/appointments/public')
  @ApiOperation({ summary: 'Public booking: create patient and appointment for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  @ApiResponse({ status: 201, description: 'Appointment and patient created' })
  async publicBookAppointment(
    @Param('tenantId') tenantId: string,
    @Body() dto: PublicBookAppointmentDto
  ): Promise<{ appointment: Appointment; patient: Patient }> {
    // 1. Find or create patient
    let patient = await this.patientService.findByPhoneAndTenant(dto.phone, tenantId);
    if (!patient) {
      patient = await this.patientService.create({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        gender: dto.gender,
        birthDate: dto.birthDate,
      }, tenantId);
    }

    // 2. Create appointment
    const appointment = await this.appointmentService.create({
      patientId: patient.id,
      tenantId,
      doctorId: dto.doctorId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      notes: dto.notes,
      status: AppointmentStatus.PENDING,
      // createdVia: 'public_form',
    });

    return { appointment, patient };
  }
}
