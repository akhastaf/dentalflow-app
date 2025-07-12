import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '../entities/patient.entity';

export class FilterPatientDto {
  @ApiPropertyOptional({ example: 'John', description: 'Search by patient name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Search by phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Search by email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Filter by gender' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

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