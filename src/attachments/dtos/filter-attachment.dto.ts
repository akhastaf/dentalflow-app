import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { AttachmentType } from '../entities/attachment.entity';

export class FilterAttachmentDto {
  @ApiPropertyOptional({ description: 'Patient ID to filter by' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ 
    enum: AttachmentType, 
    description: 'Filter by attachment type' 
  })
  @IsOptional()
  @IsEnum(AttachmentType)
  type?: AttachmentType;

  @ApiPropertyOptional({ 
    example: 'x-ray', 
    description: 'Search in filename and description' 
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