import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsUUID, IsBoolean, IsObject, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentStatus, TreatmentPriority, TreatmentPhase } from '../entities/tratment.entity';

export class CreateTreatmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Appointment ID' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({ description: 'Tenant Treatment ID' })
  @IsUUID()
  tenantTreatmentId: string;

  @ApiPropertyOptional({ description: 'Treatment Plan ID' })
  @IsOptional()
  @IsUUID()
  treatmentPlanId?: string;

  @ApiPropertyOptional({ description: 'Parent Treatment ID for dependent treatments' })
  @IsOptional()
  @IsUUID()
  parentTreatmentId?: string;

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

  @ApiPropertyOptional({ description: 'Tooth number in FDI format (e.g., "11", "36")' })
  @IsOptional()
  @IsString()
  toothNumber?: string;

  @ApiPropertyOptional({ description: 'Diagnosis' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Treatment plan description' })
  @IsOptional()
  @IsString()
  treatmentPlanDescription?: string;

  @ApiPropertyOptional({ description: 'Clinical notes' })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({ description: 'Post-treatment instructions' })
  @IsOptional()
  @IsString()
  postTreatmentInstructions?: string;

  @ApiProperty({ description: 'Treatment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Amount paid' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Planned date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional({ description: 'Estimated duration in HH:MM format' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Duration must be in HH:MM format' })
  estimatedDuration?: string;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @ApiPropertyOptional({ description: 'Progress notes' })
  @IsOptional()
  @IsString()
  progressNotes?: string;

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
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 