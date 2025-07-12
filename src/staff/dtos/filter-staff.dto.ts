import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { StaffRole } from '../entities/staff.entity';
import { Transform } from 'class-transformer';

export class FilterStaffDto {
  @ApiPropertyOptional({ example: 'john', description: 'Search by user name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: StaffRole, description: 'Filter by role' })
  @IsEnum(StaffRole)
  @IsOptional()
  role?: StaffRole;

  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  limit?: number = 10;
} 