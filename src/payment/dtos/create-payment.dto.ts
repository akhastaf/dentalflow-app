import {
  IsUUID,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export class PaymentTreatmentDto {
  @ApiProperty({ description: 'Treatment ID' })
  @IsUUID()
  treatmentId: string;

  @ApiProperty({ 
    description: 'Amount paid for this specific treatment',
    example: 100.00,
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amountPaid: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'Total payment amount',
    example: 450.00,
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Whether this is a partial payment',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isPartial?: boolean;

  @ApiPropertyOptional({ 
    enum: PaymentMethod,
    description: 'Payment method used'
  })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ 
    enum: PaymentStatus,
    description: 'Payment status',
    default: PaymentStatus.COMPLETED
  })
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ 
    description: 'Payment reference number (receipt number)'
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes about the payment'
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ 
    description: 'List of treatments being paid with their amounts',
    type: [PaymentTreatmentDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentTreatmentDto)
  paymentTreatments: PaymentTreatmentDto[];
} 