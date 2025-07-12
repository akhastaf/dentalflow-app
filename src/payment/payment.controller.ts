import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentStatus } from './dtos/create-payment.dto';
import { FilterPaymentDto } from './dtos/filter-payment.dto';
import { UpdatePaymentDto } from './dtos/update-payment.dto';

@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '1'
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // 🟢 CREATE
  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  // 🔵 GET BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  async findOne(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }

  // 🟣 LIST WITH FILTERS
  @Get()
  @ApiOperation({ summary: 'List payments (with optional filters)' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async findAll(@Query() filters: FilterPaymentDto) {
    return this.paymentService.findAll(filters);
  }

  // 🟠 UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentService.update(id, dto);
  }

  // 🔄 UPDATE STATUS
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: PaymentStatus
  ) {
    return this.paymentService.updateStatus(id, status);
  }

  // 📋 GET AVAILABLE TREATMENTS FOR PAYMENT
  @Get('available-treatments/:patientId/:tenantId')
  @ApiOperation({ summary: 'Get available treatments for payment for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  async getAvailableTreatments(
    @Param('patientId') patientId: string,
    @Param('tenantId') tenantId: string,
  ) {
    return this.paymentService.getAvailableTreatmentsForPayment(patientId, tenantId);
  }

  // 💰 GET STATISTICS
  @Get('stats/:tenantId')
  @ApiOperation({ summary: 'Get payment statistics for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (YYYY-MM-DD)' })
  async getStats(
    @Param('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentService.getPaymentStats(tenantId, dateFrom, dateTo);
  }

  // 🗑️ GET DELETED PAYMENTS
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted payments' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' })
  async getDeletedPayments(@Query('tenantId') tenantId?: string) {
    return this.paymentService.getDeletedPayments(tenantId);
  }

  // 🔴 SOFT DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }

  // 🔄 RESTORE
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async restore(@Param('id') id: string) {
    return this.paymentService.restore(id);
  }

  // 🗑️ PERMANENT DELETE
  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a payment (use with caution)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async permanentRemove(@Param('id') id: string) {
    return this.paymentService.permanentRemove(id);
  }
}
