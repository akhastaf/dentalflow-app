import { IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyLevel, WaitingRoomStatus } from '../entities/waiting-room.entity';

export class UpdateWaitingRoomDto {
  @ApiPropertyOptional({
    example: 'a1c34-e5f6-g7h8-i901',
    description: 'ID of the doctor assigned to this patient'
  })
  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;

  @ApiPropertyOptional({
    enum: EmergencyLevel,
    example: EmergencyLevel.URGENT,
    description: 'Emergency level of the patient'
  })
  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @ApiPropertyOptional({
    enum: WaitingRoomStatus,
    example: WaitingRoomStatus.CALLED,
    description: 'Current status of the patient in waiting room'
  })
  @IsOptional()
  @IsEnum(WaitingRoomStatus)
  status?: WaitingRoomStatus;

  @ApiPropertyOptional({
    example: 2,
    description: 'Order/priority in the waiting room (1 = highest priority)',
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    example: 'Patient is ready for consultation',
    description: 'Additional notes about the patient',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    example: 'Patient requested to reschedule',
    description: 'Reason for cancellation if status is cancelled',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancellationReason?: string;
} 