import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyLevel, WaitingRoomStatus } from '../entities/waiting-room.entity';

export class FilterWaitingRoomDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search by patient name, phone, or notes'
  })
  @IsOptional()
  @IsString()
  search?: string; // Search by patient name, phone, or notes

  @ApiPropertyOptional({
    enum: WaitingRoomStatus,
    example: WaitingRoomStatus.WAITING,
    description: 'Filter by waiting room status'
  })
  @IsOptional()
  @IsEnum(WaitingRoomStatus)
  status?: WaitingRoomStatus;

  @ApiPropertyOptional({
    enum: EmergencyLevel,
    example: EmergencyLevel.NORMAL,
    description: 'Filter by emergency level'
  })
  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @ApiPropertyOptional({
    example: 'a1c34-e5f6-g7h8-i901',
    description: 'Filter by assigned doctor ID'
  })
  @IsOptional()
  @IsString()
  assignedDoctorId?: string;

  @ApiPropertyOptional({
    example: 'a1c34-e5f6-g7h8-i901',
    description: 'Filter by specific patient ID'
  })
  @IsOptional()
  @IsString()
  patientId?: string;
  
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
    minimum: 1
  })

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
} 