import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsDateString, 
  IsOptional, 
  IsUUID,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { TimeRangeType, TimeRangeStatus } from '../entities/staff-time-range.entity';

export class FilterStaffTimeRangeDto {
  @ApiPropertyOptional({ description: 'Staff member ID to filter by' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ 
    enum: TimeRangeType, 
    description: 'Filter by time range type' 
  })
  @IsOptional()
  @IsEnum(TimeRangeType)
  type?: TimeRangeType;

  @ApiPropertyOptional({ 
    enum: TimeRangeStatus, 
    description: 'Filter by status' 
  })
  @IsOptional()
  @IsEnum(TimeRangeStatus)
  status?: TimeRangeStatus;

  @ApiPropertyOptional({ 
    example: '2024-01-01', 
    description: 'Filter time ranges that start from this date' 
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ 
    example: '2024-12-31', 
    description: 'Filter time ranges that start before this date' 
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-01', 
    description: 'Filter time ranges that end from this date' 
  })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({ 
    example: '2024-12-31', 
    description: 'Filter time ranges that end before this date' 
  })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @ApiPropertyOptional({ 
    example: 'lunch', 
    description: 'Search in description and notes' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Page number for pagination',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
} 