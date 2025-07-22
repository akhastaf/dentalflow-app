import {
  IsUUID,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  PaymentMethod, 
  ExpenseCategory, 
  ExpenseStatus, 
  RecurrenceFrequency 
} from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    enum: ExpenseCategory,
    description: 'Expense category'
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiPropertyOptional({ 
    description: 'Custom category label when category is OTHER'
  })
  @IsString()
  @IsOptional()
  otherCategoryLabel?: string;

  @ApiProperty({ 
    description: 'Expense date',
    example: '2024-01-15'
  })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ 
    description: 'Supplier or vendor name'
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ 
    description: 'Reference number or invoice number'
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ 
    description: 'Total expense amount',
    example: 1500.00,
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @ApiPropertyOptional({ 
    description: 'Amount already paid',
    example: 750.00,
    minimum: 0,
    default: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number;

  @ApiPropertyOptional({ 
    enum: PaymentMethod,
    description: 'Payment method used'
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ 
    enum: ExpenseStatus,
    description: 'Expense status',
    default: ExpenseStatus.PENDING
  })
  @IsEnum(ExpenseStatus)
  @IsOptional()
  status?: ExpenseStatus;

  @ApiPropertyOptional({ 
    description: 'Date when payment was made',
    example: '2024-01-15T10:30:00Z'
  })
  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @ApiPropertyOptional({ 
    description: 'Whether this is a recurring expense',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ 
    enum: RecurrenceFrequency,
    description: 'Frequency of recurrence'
  })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  recurrenceFrequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ 
    description: 'End date for recurring expense',
    example: '2024-12-31'
  })
  @IsDateString()
  @IsOptional()
  recurrenceEndDate?: string;

  @ApiPropertyOptional({ 
    description: 'Whether this is a loan repayment',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isLoanRepayment?: boolean;

  @ApiPropertyOptional({ 
    description: 'Total loan amount',
    example: 50000.00,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  loanAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Number of months for loan',
    example: 48,
    minimum: 1,
    maximum: 360
  })
  @IsNumber()
  @Min(1)
  @Max(360)
  @IsOptional()
  loanMonths?: number;

  @ApiPropertyOptional({ 
    description: 'Path to attached receipt or file',
    nullable: true
  })
  @IsString()
  @IsOptional()
  attachmentPath?: string | null;
} 