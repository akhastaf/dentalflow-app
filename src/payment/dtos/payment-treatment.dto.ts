import {
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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