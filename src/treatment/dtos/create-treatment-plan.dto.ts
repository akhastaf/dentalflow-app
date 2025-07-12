import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsUUID, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentPlanStatus, TreatmentPlanPriority } from '../entities/treatment-plan.entity';

export class CreateTreatmentPlanDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiProperty({ description: 'Treatment plan name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Treatment plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Treatment plan status', enum: TreatmentPlanStatus })
  @IsOptional()
  @IsEnum(TreatmentPlanStatus)
  status?: TreatmentPlanStatus;

  @ApiPropertyOptional({ description: 'Treatment plan priority', enum: TreatmentPlanPriority })
  @IsOptional()
  @IsEnum(TreatmentPlanPriority)
  priority?: TreatmentPlanPriority;

  @ApiPropertyOptional({ description: 'Diagnosis' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Treatment goals' })
  @IsOptional()
  @IsString()
  treatmentGoals?: string;

  @ApiPropertyOptional({ description: 'Clinical notes' })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({ description: 'Contraindications' })
  @IsOptional()
  @IsString()
  contraindications?: string;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Total discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Estimated end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: string;

  @ApiPropertyOptional({ description: 'Estimated duration in weeks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDurationWeeks?: number;

  @ApiPropertyOptional({ description: 'Satisfaction rating (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  satisfactionRating?: number;

  @ApiPropertyOptional({ description: 'Follow-up notes' })
  @IsOptional()
  @IsString()
  followUpNotes?: string;

  @ApiPropertyOptional({ description: 'Follow-up date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 