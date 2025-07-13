import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { EmergencyLevel, WaitingRoomStatus } from '../entities/waiting-room.entity';

export class FilterWaitingRoomDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by patient name, phone, or notes

  @IsOptional()
  @IsEnum(WaitingRoomStatus)
  status?: WaitingRoomStatus;

  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @IsOptional()
  @IsString()
  assignedDoctorId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
} 