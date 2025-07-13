import { IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, MaxLength } from 'class-validator';
import { EmergencyLevel } from '../entities/waiting-room.entity';

export class CreateWaitingRoomDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;

  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
} 