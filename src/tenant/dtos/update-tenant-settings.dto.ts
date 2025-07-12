import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUrl } from 'class-validator';
import { Language } from '../entities/tenant.entity';

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({ 
    enum: Language, 
    description: 'Interface language',
    example: Language.FR 
  })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @ApiPropertyOptional({ 
    description: 'Timezone', 
    example: 'Africa/Casablanca' 
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ 
    description: 'Logo URL', 
    example: 'https://example.com/logo.png' 
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Document header image URL', 
    example: 'https://example.com/header.png' 
  })
  @IsUrl()
  @IsOptional()
  headerImageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Document watermark image URL', 
    example: 'https://example.com/watermark.png' 
  })
  @IsUrl()
  @IsOptional()
  watermarkImageUrl?: string;
} 