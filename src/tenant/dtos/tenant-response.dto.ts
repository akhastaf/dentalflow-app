import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan, Language } from '../entities/tenant.entity';

export class TenantResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'Unique identifier of the tenant' })
  id: string;

  @ApiProperty({ example: 'Dental Care Clinic', description: 'Clinic name' })
  name: string;

  @ApiProperty({ example: 'dental-care-clinic', description: 'Clinic slug for URL routing' })
  slug: string;

  @ApiProperty({ example: '+212612345678', description: 'Clinic phone number' })
  phone: string;

  @ApiProperty({ example: 'contact@dentalcare.com', description: 'Clinic email address' })
  email: string;

  @ApiProperty({ example: '123 Main Street, Casablanca', description: 'Clinic address' })
  address: string;

  @ApiProperty({ example: 'Casablanca', description: 'City' })
  city: string;

  @ApiProperty({ example: 'https://example.com/logo.png', description: 'Clinic logo URL', required: false })
  logoUrl?: string;

  @ApiProperty({ example: 'https://example.com/header.png', description: 'Document header image URL', required: false })
  headerImageUrl?: string;

  @ApiProperty({ example: 'https://example.com/watermark.png', description: 'Document watermark image URL', required: false })
  watermarkImageUrl?: string;

  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.FREE, description: 'Subscription plan' })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({ example: true, description: 'Indicates if the clinic is active' })
  isActive: boolean;

  @ApiProperty({ enum: Language, example: Language.FR, description: 'Clinic language preference', required: false })
  language?: Language;

  @ApiProperty({ example: 'Africa/Casablanca', description: 'Clinic timezone', required: false })
  timezone?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'Owner user ID', required: false })
  ownerUserId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Tenant creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Tenant last update timestamp' })
  updatedAt: Date;
} 