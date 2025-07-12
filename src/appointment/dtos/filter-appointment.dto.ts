import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from './create-appointment.dto';

export class FilterAppointmentsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ example: '2025-07-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2025-07-31' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}
