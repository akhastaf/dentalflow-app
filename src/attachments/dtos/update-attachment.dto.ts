import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateAttachmentDto {
  @ApiPropertyOptional({ description: 'Description of the attachment' })
  @IsOptional()
  @IsString()
  description?: string;
} 