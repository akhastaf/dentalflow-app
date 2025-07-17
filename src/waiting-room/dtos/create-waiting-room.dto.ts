import { IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, MaxLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyLevel } from '../entities/waiting-room.entity';

export class CreateWaitingRoomDto {
  @ApiProperty({
    example: 'a1b2c34-e5f6-g7h8-i901',
    description: 'Patient ID to add to waiting room'
  })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({
    example: 'a1b2c34-e5f6-g7h8-i901',
    description: 'ID of the doctor assigned to this patient'
  })
  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;

  @ApiPropertyOptional({
    enum: EmergencyLevel,
    example: EmergencyLevel.NORMAL,
    description: 'Emergency level of the patient'
  })
  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @ApiPropertyOptional({
    example: 1,
    description: 'Order/priority in the waiting room (1 = highest priority), minimum: 1',
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    example: 'Patient has a toothache and needs immediate attention',
    description: 'Additional notes about the patient, maxLength: 500',
    maxLength: 500
  })

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
} 