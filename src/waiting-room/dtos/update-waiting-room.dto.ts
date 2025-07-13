import { IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, MaxLength } from 'class-validator';
import { EmergencyLevel, WaitingRoomStatus } from '../entities/waiting-room.entity';

export class UpdateWaitingRoomDto {
  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;

  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @IsOptional()
  @IsEnum(WaitingRoomStatus)
  status?: WaitingRoomStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancellationReason?: string;
} 