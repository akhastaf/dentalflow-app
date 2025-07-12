import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, In, ILike } from 'typeorm';
import { Expense, ExpenseStatus, ExpenseCategory, PaymentMethod, RecurrenceFrequency } from './entities/expense.entity';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { FilterExpenseDto } from './dtos/filter-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  // ✅ CREATE
  async create(dto: CreateExpenseDto): Promise<Expense> {
    // Validate that paid amount doesn't exceed total amount
    if (dto.amountPaid && dto.amountPaid > dto.totalAmount) {
      throw new BadRequestException('Paid amount cannot exceed total amount');
    }

    // Determine status based on amounts
    let status = dto.status || ExpenseStatus.PENDING;
    if (dto.amountPaid) {
      if (dto.amountPaid >= dto.totalAmount) {
        status = ExpenseStatus.PAID;
      } else if (dto.amountPaid > 0) {
        status = ExpenseStatus.PARTIALLY_PAID;
      }
    }

    // Override status for special types
    if (dto.isRecurring) {
      status = ExpenseStatus.PAID; // Recurring expenses are typically paid
    }
    if (dto.isLoanRepayment) {
      status = ExpenseStatus.PAID; // Loan repayments are typically paid
    }

    const expense = this.expenseRepo.create({
      ...dto,
      status,
      amountPaid: dto.amountPaid || 0,
      expenseDate: new Date(dto.expenseDate),
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
    });

    return await this.expenseRepo.save(expense);
  }

  // 🔎 FIND ONE BY ID
  async findById(id: string, includeDeleted: boolean = false): Promise<Expense> {
    const found = await this.expenseRepo.findOne({ 
      where: { id },
      withDeleted: includeDeleted
    });
    if (!found) throw new NotFoundException('Expense not found');
    return found;
  }

  // 📋 FILTER LIST
  async findAll(filters: FilterExpenseDto): Promise<Expense[]> {
    const where: FindOptionsWhere<Expense> = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.categories && filters.categories.length > 0) {
      where.category = In(filters.categories);
    }
    if (filters.statuses && filters.statuses.length > 0) {
      where.status = In(filters.statuses);
    }
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring;
    if (filters.isLoanRepayment !== undefined) where.isLoanRepayment = filters.isLoanRepayment;
    if (filters.recurrenceFrequency) where.recurrenceFrequency = filters.recurrenceFrequency;
    if (filters.supplier) where.supplier = ILike(`%${filters.supplier}%`);
    if (filters.reference) where.reference = ILike(`%${filters.reference}%`);

    // Handle amount range
    if (filters.minAmount || filters.maxAmount) {
      if (filters.minAmount && filters.maxAmount) {
        where.totalAmount = Between(filters.minAmount, filters.maxAmount);
      } else if (filters.minAmount) {
        where.totalAmount = MoreThanOrEqual(filters.minAmount);
      } else if (filters.maxAmount) {
        where.totalAmount = LessThanOrEqual(filters.maxAmount);
      }
    }

    // Handle date range
    if (filters.dateFrom && filters.dateTo) {
      where.expenseDate = Between(new Date(filters.dateFrom), new Date(filters.dateTo));
    }

    const query = this.expenseRepo.createQueryBuilder('expense')
      .where(where);

    // Handle soft delete filtering
    if (filters.includeDeleted) {
      query.withDeleted();
    }

    // Handle keyword search
    if (filters.keyword) {
      const keyword = `%${filters.keyword}%`;
      query.andWhere(
        '(expense.supplier ILIKE :keyword OR expense.reference ILIKE :keyword OR expense.otherCategoryLabel ILIKE :keyword)',
        { keyword }
      );
    }

    return await query
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .getMany();
  }

  // 🛠️ UPDATE
  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findById(id);
    
    // Validate that paid amount doesn't exceed total amount
    if (dto.amountPaid && dto.totalAmount && dto.amountPaid > dto.totalAmount) {
      throw new BadRequestException('Paid amount cannot exceed total amount');
    }

    // Determine status based on amounts
    if (dto.amountPaid !== undefined || dto.totalAmount !== undefined) {
      const paidAmount = dto.amountPaid ?? expense.amountPaid;
      const totalAmount = dto.totalAmount ?? expense.totalAmount;
      
      if (paidAmount >= totalAmount) {
        dto.status = ExpenseStatus.PAID;
      } else if (paidAmount > 0) {
        dto.status = ExpenseStatus.PARTIALLY_PAID;
      } else {
        dto.status = ExpenseStatus.PENDING;
      }
    }

    // Override status for special types
    if (dto.isRecurring) {
      dto.status = ExpenseStatus.PAID;
    }
    if (dto.isLoanRepayment) {
      dto.status = ExpenseStatus.PAID;
    }

    // Convert date strings to Date objects
    if (dto.expenseDate) {
      dto.expenseDate = new Date(dto.expenseDate) as any;
    }
    if (dto.paidAt) {
      dto.paidAt = new Date(dto.paidAt) as any;
    }
    if (dto.recurrenceEndDate) {
      dto.recurrenceEndDate = new Date(dto.recurrenceEndDate) as any;
    }

    Object.assign(expense, dto);
    return await this.expenseRepo.save(expense);
  }

  // 💰 GET EXPENSE STATISTICS
  async getExpenseStats(tenantId: string, dateFrom?: string, dateTo?: string) {
    const query = this.expenseRepo.createQueryBuilder('expense')
      .where('expense.tenantId = :tenantId', { tenantId });

    if (dateFrom && dateTo) {
      query.andWhere('expense.expenseDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo)
      });
    }

    const expenses = await query.getMany();
    
    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0);
    const totalPaid = expenses.reduce((sum, expense) => sum + Number(expense.amountPaid), 0);
    const expenseCount = expenses.length;
    
    // Group by category
    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, paid: 0 };
      }
      acc[category].total += Number(expense.totalAmount);
      acc[category].count += 1;
      acc[category].paid += Number(expense.amountPaid);
      return acc;
    }, {} as Record<string, { total: number; count: number; paid: number }>);

    // Group by status
    const byStatus = expenses.reduce((acc, expense) => {
      const status = expense.status;
      if (!acc[status]) {
        acc[status] = { total: 0, count: 0 };
      }
      acc[status].total += Number(expense.totalAmount);
      acc[status].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Group by payment method
    const byPaymentMethod = expenses.reduce((acc, expense) => {
      const method = expense.paymentMethod || 'unknown';
      if (!acc[method]) {
        acc[method] = { total: 0, count: 0 };
      }
      acc[method].total += Number(expense.totalAmount);
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return {
      totalAmount,
      totalPaid,
      totalUnpaid: totalAmount - totalPaid,
      expenseCount,
      byCategory,
      byStatus,
      byPaymentMethod,
      averageAmount: expenseCount > 0 ? totalAmount / expenseCount : 0,
      paidPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0
    };
  }

  // 🔄 UPDATE STATUS
  async updateStatus(id: string, status: ExpenseStatus): Promise<Expense> {
    const expense = await this.findById(id);
    expense.status = status;
    return await this.expenseRepo.save(expense);
  }

  // 🗑️ SOFT DELETE
  async remove(id: string): Promise<void> {
    const expense = await this.findById(id);
    await this.expenseRepo.softRemove(expense);
  }

  // 🗑️ PERMANENT DELETE (use with caution)
  async permanentRemove(id: string): Promise<void> {
    const expense = await this.findById(id);
    await this.expenseRepo.remove(expense);
  }

  // 🔄 RESTORE SOFT DELETED EXPENSE
  async restore(id: string): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      withDeleted: true
    });
    
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    
    if (!expense.deletedAt) {
      throw new BadRequestException('Expense is not deleted');
    }
    
    await this.expenseRepo.restore(id);
    return await this.findById(id);
  }

  // 🗑️ GET DELETED EXPENSES
  async getDeletedExpenses(tenantId?: string): Promise<Expense[]> {
    const query = this.expenseRepo.createQueryBuilder('expense')
      .withDeleted()
      .where('expense.deletedAt IS NOT NULL');

    if (tenantId) {
      query.andWhere('expense.tenantId = :tenantId', { tenantId });
    }

    return await query
      .orderBy('expense.deletedAt', 'DESC')
      .getMany();
  }

  // 📊 GET EXPENSE CATEGORIES
  async getExpenseCategories(): Promise<{ value: string; label: string }[]> {
    return [
      { value: ExpenseCategory.SUPPLIES, label: 'Supplies' },
      { value: ExpenseCategory.EQUIPMENT, label: 'Equipment' },
      { value: ExpenseCategory.RENT, label: 'Rent' },
      { value: ExpenseCategory.SALARY, label: 'Salaries' },
      { value: ExpenseCategory.ELECTRICITY, label: 'Electricity' },
      { value: ExpenseCategory.INTERNET, label: 'Internet' },
      { value: ExpenseCategory.MAINTENANCE, label: 'Maintenance' },
      { value: ExpenseCategory.LOAN_REPAYMENT, label: 'Loan Repayment' },
      { value: ExpenseCategory.OTHER, label: 'Other' },
    ];
  }

  // 📊 GET PAYMENT METHODS
  async getPaymentMethods(): Promise<{ value: string; label: string }[]> {
    return [
      { value: PaymentMethod.CASH, label: 'Cash' },
      { value: PaymentMethod.CARD, label: 'Credit Card' },
      { value: PaymentMethod.BANK, label: 'Bank Transfer' },
      { value: PaymentMethod.CHEQUE, label: 'Check' },
      { value: PaymentMethod.OTHER, label: 'Other' },
    ];
  }

  // 📊 GET RECURRENCE FREQUENCIES
  async getRecurrenceFrequencies(): Promise<{ value: string; label: string }[]> {
    return [
      { value: RecurrenceFrequency.DAILY, label: 'Daily' },
      { value: RecurrenceFrequency.WEEKLY, label: 'Weekly' },
      { value: RecurrenceFrequency.MONTHLY, label: 'Monthly' },
      { value: RecurrenceFrequency.YEARLY, label: 'Yearly' },
    ];
  }
}
