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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
import { FilterExpenseDto } from './dtos/filter-expense.dto';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { MinioService } from '../minio/minio.service';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(
    private readonly expensesService: ExpenseService,
    private readonly minioService: MinioService
  ) {}

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
    return [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ];
  }

  // 📎 UPLOAD EXPENSE ATTACHMENT
  @Post(':id/attachment')
  @ApiOperation({ summary: 'Upload attachment for an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (images, PDFs, documents)'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Attachment uploaded successfully' 
  })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check if expense exists
    const expense = await this.expensesService.findById(id);
    if (!expense) {
      throw new BadRequestException('Expense not found');
    }

    // Upload file to MinIO
    const folder = `expenses/${expense.tenantId}`;
    const result = await this.minioService.uploadFileWithProcessing(file, folder);

    // Extract the file key from the URL (remove the base URL part)
    const fileKey = result.urls.original.replace(this.minioService.getFileUrl(''), '');

    // Update expense with attachment path (store only the file key, not the full URL)
    const updatedExpense = await this.expensesService.update(id, {
      attachmentPath: fileKey
    });

    return {
      message: 'Attachment uploaded successfully',
      expense: updatedExpense,
      file: {
        uuid: result.uuid,
        originalName: result.originalName,
        safeName: result.safeName,
        urls: result.urls,
        size: result.size,
        isImage: result.isImage,
        metadata: result.metadata,
      }
    };
  }

  // 📎 GET EXPENSE ATTACHMENT URL
  @Get(':id/attachment')
  @ApiOperation({ summary: 'Get attachment URL for an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Attachment URL retrieved' 
  })
  @ApiResponse({ status: 404, description: 'Expense or attachment not found' })
  async getAttachmentUrl(@Param('id') id: string) {
    const expense = await this.expensesService.findById(id);
    if (!expense) {
      throw new BadRequestException('Expense not found');
    }

    if (!expense.attachmentPath) {
      throw new BadRequestException('No attachment found for this expense');
    }

    // Handle both old URLs and new file keys
    let fileKey = expense.attachmentPath;
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      // Extract file key from URL (remove the base URL part)
      fileKey = fileKey.replace(this.minioService.getFileUrl(''), '');
    }

    // Get signed URL for the attachment
    const signedUrl = await this.minioService.getSignedUrl(fileKey);
    
    return {
      attachmentUrl: signedUrl,
      attachmentPath: fileKey // Return the file key, not the full URL
    };
  }

  // 📎 GET EXPENSE ATTACHMENT INFO
  @Get(':id/attachment/info')
  @ApiOperation({ summary: 'Get attachment information including all versions and metadata' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Attachment information retrieved' 
  })
  @ApiResponse({ status: 404, description: 'Expense or attachment not found' })
  async getAttachmentInfo(@Param('id') id: string) {
    const expense = await this.expensesService.findById(id);
    if (!expense) {
      throw new BadRequestException('Expense not found');
    }

    if (!expense.attachmentPath) {
      throw new BadRequestException('No attachment found for this expense');
    }

    // Handle both old URLs and new file keys
    let fileKey = expense.attachmentPath;
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      // Extract file key from URL (remove the base URL part)
      fileKey = fileKey.replace(this.minioService.getFileUrl(''), '');
    }

    // Get file information including all versions
    const fileInfo = await this.minioService.getFileInfo(fileKey);
    
    return {
      expenseId: id,
      attachmentPath: fileKey, // Return the file key, not the full URL
      fileName: fileKey.split('/').pop(),
      fileInfo
    };
  }

  // 📎 DELETE EXPENSE ATTACHMENT
  @Delete(':id/attachment')
  @ApiOperation({ summary: 'Delete attachment for an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Attachment deleted successfully' 
  })
  @ApiResponse({ status: 404, description: 'Expense or attachment not found' })
  async deleteAttachment(@Param('id') id: string) {
    const expense = await this.expensesService.findById(id);
    if (!expense) {
      throw new BadRequestException('Expense not found');
    }

    if (!expense.attachmentPath) {
      throw new BadRequestException('No attachment found for this expense');
    }

    console.log('Before deletion - attachmentPath:', expense.attachmentPath);

    // Handle both old URLs and new file keys
    let fileKey = expense.attachmentPath;
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      // Extract file key from URL (remove the base URL part)
      fileKey = fileKey.replace(this.minioService.getFileUrl(''), '');
    }

    // Delete file from MinIO (including all image versions if it's an image)
    await this.minioService.deleteFileWithVersions(fileKey);

    // Update expense to remove attachment path
    const updatedExpense = await this.expensesService.update(id, {
      attachmentPath: null
    });

    // Also try a direct query to ensure the field is cleared
    await this.expensesService.clearAttachmentPath(id);

    // Fetch the expense again to get the final state
    const finalExpense = await this.expensesService.findById(id);

    console.log('After deletion - attachmentPath:', finalExpense.attachmentPath);

    return {
      message: 'Attachment deleted successfully',
      expense: finalExpense
    };
  }
}
