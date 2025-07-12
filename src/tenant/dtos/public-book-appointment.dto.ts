import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsPhoneNumber } from 'class-validator';
import { Gender } from '../../patient/entities/patient.entity';

export class PublicBookAppointmentDto {
  // Patient Info
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  // Appointment Info
  @ApiProperty({ example: '2025-07-04' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:30:00' })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ example: '11:00:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 'Some notes for the doctor' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Doctor ID (optional, if patient selects a specific doctor)' })
  @IsString()
  @IsOptional()
  doctorId?: string;
} 