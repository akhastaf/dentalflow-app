import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  PaymentMethod, 
  ExpenseCategory, 
  ExpenseStatus, 
  RecurrenceFrequency 
} from '../entities/expense.entity';

export class FilterExpenseDto {
  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
  

  @ApiPropertyOptional({ description: 'Search keyword for supplier, reference, or other category label' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by expense categories',
    // type: [ExpenseCategory]
  })
  @IsEnum(ExpenseCategory, { each: true })
  @IsOptional()
  categories?: ExpenseCategory[];

  @ApiPropertyOptional({ 
    description: 'Filter by expense statuses',
    // type: [ExpenseStatus]
  })
  @IsEnum(ExpenseStatus, { each: true })
  @IsOptional()
  statuses?: ExpenseStatus[];

  @ApiPropertyOptional({ description: 'Filter by payment method' })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier name' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Filter by reference number' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Filter recurring expenses only' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Filter loan repayments only' })
  @IsBoolean()
  @IsOptional()
  isLoanRepayment?: boolean;

  @ApiPropertyOptional({ description: 'Filter by recurrence frequency' })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  recurrenceFrequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Include soft-deleted expenses in results' })
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
} 