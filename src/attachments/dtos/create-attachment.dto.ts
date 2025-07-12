import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAttachmentDto {
  @ApiProperty({ description: 'Patient ID to attach the file to' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Description of the attachment' })
  @IsOptional()
  @IsString()
  description?: string;
} 