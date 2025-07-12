import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Patient ID', example: 'uuid-patient' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ enum: DocumentType, description: 'Type of document' })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Document title', example: 'Dental X-Ray Report' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description or notes', example: 'Routine checkup x-ray' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Assigned doctor ID', example: 'uuid-doctor' })
  @IsUUID()
  @IsOptional()
  assignedDoctorId?: string;

  @ApiPropertyOptional({ description: 'File URL (if uploaded)', example: 'https://files.example.com/doc.pdf' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({ 
    description: 'Document data as JSON', 
    example: {
      diagnosis: 'Cavity in tooth #14',
      treatment: 'Filling required',
      medications: ['Amoxicillin', 'Ibuprofen'],
      notes: 'Patient should return in 2 weeks'
    }
  })
  @IsObject()
  data: Record<string, any>;
} 