import { IsOptional, IsString, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentStatus, TreatmentPriority, TreatmentPhase } from '../entities/tratment.entity';
import { TreatmentPlanStatus, TreatmentPlanPriority } from '../entities/treatment-plan.entity';

export class FilterTreatmentDto {
  @ApiPropertyOptional({ description: 'Patient ID' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Treatment Plan ID' })
  @IsOptional()
  @IsUUID()
  treatmentPlanId?: string;

  @ApiPropertyOptional({ description: 'Tenant Treatment ID' })
  @IsOptional()
  @IsUUID()
  tenantTreatmentId?: string;

  @ApiPropertyOptional({ description: 'Treatment status', enum: TreatmentStatus })
  @IsOptional()
  @IsEnum(TreatmentStatus)
  status?: TreatmentStatus;

  @ApiPropertyOptional({ description: 'Treatment priority', enum: TreatmentPriority })
  @IsOptional()
  @IsEnum(TreatmentPriority)
  priority?: TreatmentPriority;

  @ApiPropertyOptional({ description: 'Treatment phase', enum: TreatmentPhase })
  @IsOptional()
  @IsEnum(TreatmentPhase)
  phase?: TreatmentPhase;

  @ApiPropertyOptional({ description: 'Tooth number' })
  @IsOptional()
  @IsString()
  toothNumber?: string;

  @ApiPropertyOptional({ description: 'Search in diagnosis, clinical notes, etc.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date for date range filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum progress percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minProgress?: number;

  @ApiPropertyOptional({ description: 'Maximum progress percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxProgress?: number;

  @ApiPropertyOptional({ description: 'Include completed treatments' })
  @IsOptional()
  @IsBoolean()
  includeCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Include cancelled treatments' })
  @IsOptional()
  @IsBoolean()
  includeCancelled?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'progressPercentage' | 'plannedDate' | 'priority';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
} 