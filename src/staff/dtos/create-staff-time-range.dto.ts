import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsDateString, 
  IsOptional, 
  IsUUID, 
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateIf,
  Matches
} from 'class-validator';
import { TimeRangeType, TimeRangeStatus } from '../entities/staff-time-range.entity';

export class CreateStaffTimeRangeDto {
  @ApiProperty({ description: 'Staff member ID' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ 
    enum: TimeRangeType, 
    description: 'Type of time range (break, vacation, etc.)' 
  })
  @IsEnum(TimeRangeType)
  type: TimeRangeType;

  @ApiProperty({ 
    example: '2024-01-15', 
    description: 'Start date of the time range' 
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    example: '2024-01-20', 
    description: 'End date of the time range' 
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ 
    example: '09:00', 
    description: 'Start time (HH:MM format). Required for daily time ranges.' 
  })
  @ValidateIf(o => o.startTime !== undefined)
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime?: string;

  @ApiPropertyOptional({ 
    example: '17:00', 
    description: 'End time (HH:MM format). Required for daily time ranges.' 
  })
  @ValidateIf(o => o.endTime !== undefined)
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime?: string;

  @ApiPropertyOptional({ 
    example: 'Lunch break', 
    description: 'Description of the time range' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    example: 'Personal notes about this time off', 
    description: 'Additional notes' 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    example: false, 
    description: 'Whether this is a recurring time range' 
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ 
    example: [1, 2, 3, 4, 5], 
    description: 'Recurring days (1=Monday, 2=Tuesday, etc.). Required if isRecurring is true.' 
  })
  @ValidateIf(o => o.isRecurring === true)
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  recurringDays?: number[];

  @ApiPropertyOptional({ 
    example: '2024-12-31', 
    description: 'End date for recurring pattern. Required if isRecurring is true.' 
  })
  @ValidateIf(o => o.isRecurring === true)
  @IsDateString()
  recurringEndDate?: string;

  @ApiPropertyOptional({ 
    enum: TimeRangeStatus, 
    default: TimeRangeStatus.APPROVED,
    description: 'Status of the time range request' 
  })
  @IsOptional()
  @IsEnum(TimeRangeStatus)
  status?: TimeRangeStatus;
} 