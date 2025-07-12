import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  FINISHED = 'finished',
  RESCHEDULED = 'rescheduled',
}

export enum AppointmentSource {
  STAFF = 'staff',
  PUBLIC_FORM = 'public_form',
  AUTO_FROM_TREATMENT = 'auto_from_treatment',
  REFERRAL = 'referral',
}

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiProperty({ example: '2025-07-04' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:30:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiPropertyOptional({ example: '11:00:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: AppointmentSource })
  @IsEnum(AppointmentSource)
  @IsOptional()
  createdVia?: AppointmentSource;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'iCal-compatible recurrence rule (RRULE)' })
  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional({ example: '2025-08-30' })
  @IsDateString()
  @IsOptional()
  recurrenceEndsAt?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentRecurringId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  rescheduledFromId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
