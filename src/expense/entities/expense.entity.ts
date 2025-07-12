import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK = 'bank',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum ExpenseCategory {
  RENT = 'rent',
  SALARY = 'salary',
  SUPPLIES = 'supplies',
  ELECTRICITY = 'electricity',
  INTERNET = 'internet',
  MAINTENANCE = 'maintenance',
  EQUIPMENT = 'equipment',
  LOAN_REPAYMENT = 'loan_repayment',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  PENDING = 'pending',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('expenses')
@Index('idx_expense_tenant_id', ['tenantId'])
@Index('idx_expense_expense_date', ['expenseDate'])
@Index('idx_expense_category', ['category'])
@Index(['tenantId', 'reference'], { unique: true }) // Optional if reference is used as a unique identifier
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ nullable: true })
  supplier?: string;

  @Column({ nullable: true })
  reference?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'enum', enum: RecurrenceFrequency, nullable: true })
  recurrenceFrequency?: RecurrenceFrequency;

  @Column({ type: 'date', nullable: true })
  recurrenceEndDate?: Date;

  @Column({ default: false })
  isLoanRepayment: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  loanAmount?: number;

  @Column({ type: 'int', nullable: true })
  loanMonths?: number;

  @Column({ nullable: true })
  attachmentPath?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
