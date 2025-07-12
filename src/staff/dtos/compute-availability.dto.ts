import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsDateString, 
  IsOptional, 
  IsNumber,
  Min,
  Max,
  Matches
} from 'class-validator';

export class ComputeAvailabilityDto {
  @ApiProperty({ 
    example: '2024-01-15', 
    description: 'Start date for availability computation' 
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    example: '2024-01-20', 
    description: 'End date for availability computation' 
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ 
    example: 30, 
    description: 'Slot duration in minutes (default: 30)',
    minimum: 5,
    maximum: 480
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  slotDuration?: number;

  @ApiPropertyOptional({ 
    example: '09:00', 
    description: 'Working hours start time (HH:MM format)',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  workingHoursStart?: string;

  @ApiPropertyOptional({ 
    example: '17:00', 
    description: 'Working hours end time (HH:MM format)',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  workingHoursEnd?: string;
}

export class QuickAvailabilityCheckDto {
  @ApiProperty({ 
    example: '2024-01-15', 
    description: 'Date to check availability' 
  })
  @IsDateString()
  date: string;

  @ApiProperty({ 
    example: '10:00', 
    description: 'Start time to check (HH:MM format)',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ 
    example: '11:00', 
    description: 'End time to check (HH:MM format)',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;
}

export class NextAvailableSlotDto {
  @ApiProperty({ 
    example: '2024-01-15', 
    description: 'Date to find next available slot' 
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ 
    example: '10:00', 
    description: 'Preferred time to start looking from (HH:MM format)',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  preferredTime?: string;

  @ApiPropertyOptional({ 
    example: 30, 
    description: 'Slot duration in minutes (default: 30)',
    minimum: 5,
    maximum: 480
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  slotDuration?: number;
} 