import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
import { FilterExpenseDto } from './dtos/filter-expense.dto';
import { Expense, ExpenseStatus } from './entities/expense.entity';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expensesService: ExpenseService) {}

  // ✅ CREATE EXPENSE
  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ 
    status: 201, 
    description: 'Expense created successfully',
    type: Expense 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async create(@Body() dto: CreateExpenseDto): Promise<Expense> {
    return await this.expensesService.create(dto);
  }

  // 🔎 GET EXPENSE BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiQuery({ 
    name: 'includeDeleted', 
    required: false, 
    description: 'Include soft-deleted expense' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Expense found',
    type: Expense 
  })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findById(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: boolean
  ): Promise<Expense> {
    return await this.expensesService.findById(id, includeDeleted);
  }

  // 📋 GET ALL EXPENSES (with filters)
  @Get()
  @ApiOperation({ summary: 'Get all expenses with optional filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of expenses',
    type: [Expense] 
  })
  async findAll(@Query() filters: FilterExpenseDto): Promise<Expense[]> {
    return await this.expensesService.findAll(filters);
  }

  // 🛠️ UPDATE EXPENSE
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Expense updated successfully',
    type: Expense 
  })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto
  ): Promise<Expense> {
    return await this.expensesService.update(id, dto);
  }

  // 🔄 UPDATE EXPENSE STATUS
  @Put(':id/status')
  @ApiOperation({ summary: 'Update expense status' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status updated successfully',
    type: Expense 
  })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ExpenseStatus
  ): Promise<Expense> {
    return await this.expensesService.updateStatus(id, status);
  }

  // 🗑️ SOFT DELETE EXPENSE
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 204, description: 'Expense soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.expensesService.remove(id);
  }

  // 🗑️ PERMANENT DELETE EXPENSE
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete an expense (use with caution)' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 204, description: 'Expense permanently deleted' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async permanentRemove(@Param('id') id: string): Promise<void> {
    await this.expensesService.permanentRemove(id);
  }

  // 🔄 RESTORE SOFT DELETED EXPENSE
  @Put(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Expense restored successfully',
    type: Expense 
  })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 400, description: 'Expense is not deleted' })
  async restore(@Param('id') id: string): Promise<Expense> {
    return await this.expensesService.restore(id);
  }

  // 🗑️ GET DELETED EXPENSES
  @Get('deleted/list')
  @ApiOperation({ summary: 'Get all soft-deleted expenses' })
  @ApiQuery({ 
    name: 'tenantId', 
    required: false, 
    description: 'Filter by tenant ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of deleted expenses',
    type: [Expense] 
  })
  async getDeletedExpenses(@Query('tenantId') tenantId?: string): Promise<Expense[]> {
    return await this.expensesService.getDeletedExpenses(tenantId);
  }

  // 📊 GET EXPENSE STATISTICS
  @Get('stats/summary')
  @ApiOperation({ summary: 'Get expense statistics and summary' })
  @ApiQuery({ 
    name: 'tenantId', 
    required: true, 
    description: 'Tenant ID for statistics' 
  })
  @ApiQuery({ 
    name: 'dateFrom', 
    required: false, 
    description: 'Start date for statistics (YYYY-MM-DD)' 
  })
  @ApiQuery({ 
    name: 'dateTo', 
    required: false, 
    description: 'End date for statistics (YYYY-MM-DD)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Expense statistics',
    schema: {
      type: 'object',
      properties: {
        totalAmount: { type: 'number' },
        totalPaid: { type: 'number' },
        totalUnpaid: { type: 'number' },
        expenseCount: { type: 'number' },
        byCategory: { type: 'object' },
        byStatus: { type: 'object' },
        byPaymentMethod: { type: 'object' },
        averageAmount: { type: 'number' },
        paidPercentage: { type: 'number' }
      }
    }
  })
  async getExpenseStats(
    @Query('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return await this.expensesService.getExpenseStats(tenantId, dateFrom, dateTo);
  }

  // 📊 GET EXPENSE CATEGORIES
  @Get('categories/list')
  @ApiOperation({ summary: 'Get list of available expense categories' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of expense categories',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' }
        }
      }
    }
  })
  async getExpenseCategories() {
    return await this.expensesService.getExpenseCategories();
  }

  // 📊 GET PAYMENT METHODS
  @Get('payment-methods/list')
  @ApiOperation({ summary: 'Get list of available payment methods' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of payment methods',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' }
        }
      }
    }
  })
  async getPaymentMethods() {
    return await this.expensesService.getPaymentMethods();
  }

  // 📊 GET RECURRENCE FREQUENCIES
  @Get('recurrence-frequencies/list')
  @ApiOperation({ summary: 'Get list of available recurrence frequencies' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of recurrence frequencies',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' }
        }
      }
    }
  })
  async getRecurrenceFrequencies() {
    return await this.expensesService.getRecurrenceFrequencies();
  }
}
