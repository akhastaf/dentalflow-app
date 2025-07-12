import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsString, IsNumber } from 'class-validator';
import { DocumentType } from '../entities/document.entity';
import { Transform } from 'class-transformer';

export class FilterDocumentDto {
  @ApiPropertyOptional({ description: 'Patient ID', example: 'uuid-patient' })
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ enum: DocumentType, description: 'Type of document' })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional({ description: 'Search by title or description', example: 'x-ray' })
  @IsString()
  @IsOptional()
  search?: string;

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