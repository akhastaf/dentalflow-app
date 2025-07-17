import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, Length, IsPhoneNumber } from 'class-validator';

export class UpdateTenantProfileDto {
  @ApiPropertyOptional({ description: 'Clinic name', example: 'Dental Care Clinic' })
  @IsString()
  @Length(2, 255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Clinic phone number', example: '+212612345678' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Clinic email', example: 'contact@dentalcare.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Clinic address', example: '123 Main Street, Casablanca' })
  @IsString()
  @Length(10, 500)
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Casablanca' })
  @IsString()
  @Length(2, 100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Tax ID (ICE)', example: '000123456789' })
  @IsString()
  @Length(9, 50)
  @IsOptional()
  taxId?: string;
} 