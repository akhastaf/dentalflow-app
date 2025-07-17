import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TreatmentService, TreatmentStatistics, TreatmentPlanStatistics } from './treatment.service';
import { CreateTreatmentDto } from './dtos/create-treatment.dto';
import { UpdateTreatmentDto } from './dtos/update-treatment.dto';
import { FilterTreatmentDto } from './dtos/filter-treatment.dto';
import { CreateTreatmentPlanDto } from './dtos/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dtos/update-treatment-plan.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RequestWithUser } from '../types/request-with-user';
import { Treatment } from './entities/tratment.entity';
import { TreatmentPlan } from './entities/treatment-plan.entity';

@ApiTags('Treatments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({
  path: 'treatments',
  version: '1'
})
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  // Treatment CRUD Operations
  @Post()
  @ApiOperation({ summary: 'Create a new treatment' })
  @ApiResponse({ status: 201, description: 'Treatment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createTreatmentDto: CreateTreatmentDto,
    @Request() req: RequestWithUser,
  ): Promise<Treatment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.create(createTreatmentDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all treatments with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by treatment status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in diagnosis and notes' })
  @ApiResponse({ status: 200, description: 'Treatments retrieved successfully' })
  async findAll(
    @Query() filterDto: FilterTreatmentDto,
    @Request() req: RequestWithUser,
  ): Promise<{ treatments: Treatment[]; total: number }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.findAll(filterDto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific treatment by ID' })
  @ApiParam({ name: 'id', description: 'Treatment ID' })
  @ApiResponse({ status: 200, description: 'Treatment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Treatment not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Treatment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a treatment' })
  @ApiParam({ name: 'id', description: 'Treatment ID' })
  @ApiResponse({ status: 200, description: 'Treatment updated successfully' })
  @ApiResponse({ status: 404, description: 'Treatment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
    @Request() req: RequestWithUser,
  ): Promise<Treatment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.update(id, updateTreatmentDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a treatment (soft delete)' })
  @ApiParam({ name: 'id', description: 'Treatment ID' })
  @ApiResponse({ status: 200, description: 'Treatment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Treatment not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    await this.treatmentService.remove(id, tenantId);
    return { message: 'Treatment deleted successfully' };
  }

  // Treatment Plan Operations
  @Post('plans')
  @ApiOperation({ summary: 'Create a new treatment plan' })
  @ApiResponse({ status: 201, description: 'Treatment plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTreatmentPlan(
    @Body() createPlanDto: CreateTreatmentPlanDto,
    @Request() req: RequestWithUser,
  ): Promise<TreatmentPlan> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.createTreatmentPlan(createPlanDto, tenantId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all treatment plans' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiResponse({ status: 200, description: 'Treatment plans retrieved successfully' })
  async findAllTreatmentPlans(
    @Request() req: RequestWithUser,
    @Query('patientId') patientId?: string,
  ): Promise<TreatmentPlan[]> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.findAllTreatmentPlans(tenantId, patientId);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a specific treatment plan by ID' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Treatment plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  async findOneTreatmentPlan(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<TreatmentPlan> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.findOneTreatmentPlan(id, tenantId);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a treatment plan' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Treatment plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  async updateTreatmentPlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateTreatmentPlanDto,
    @Request() req: RequestWithUser,
  ): Promise<TreatmentPlan> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.updateTreatmentPlan(id, updatePlanDto, tenantId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a treatment plan (soft delete)' })
  @ApiParam({ name: 'id', description: 'Treatment plan ID' })
  @ApiResponse({ status: 200, description: 'Treatment plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Treatment plan not found' })
  async removeTreatmentPlan(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    await this.treatmentService.removeTreatmentPlan(id, tenantId);
    return { message: 'Treatment plan deleted successfully' };
  }

  // Statistics and Analytics
  @Get('statistics/treatments')
  @ApiOperation({ summary: 'Get treatment statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for statistics (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for statistics (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Treatment statistics retrieved successfully' })
  async getTreatmentStatistics(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TreatmentStatistics> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.getTreatmentStatistics(tenantId, startDate, endDate);
  }

  @Get('statistics/plans')
  @ApiOperation({ summary: 'Get treatment plan statistics' })
  @ApiResponse({ status: 200, description: 'Treatment plan statistics retrieved successfully' })
  async getTreatmentPlanStatistics(
    @Request() req: RequestWithUser,
  ): Promise<TreatmentPlanStatistics> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.getTreatmentPlanStatistics(tenantId);
  }

  // Advanced Features
  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update treatment progress' })
  @ApiParam({ name: 'id', description: 'Treatment ID' })
  @ApiQuery({ name: 'progressPercentage', required: true, description: 'Progress percentage (0-100)' })
  @ApiQuery({ name: 'progressNotes', required: false, description: 'Progress notes' })
  @ApiResponse({ status: 200, description: 'Treatment progress updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid progress percentage' })
  @ApiResponse({ status: 404, description: 'Treatment not found' })
  async updateTreatmentProgress(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Query('progressPercentage') progressPercentage: number,
    @Query('progressNotes') progressNotes?: string,
  ): Promise<Treatment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.updateTreatmentProgress(id, progressPercentage, tenantId, progressNotes);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all treatments and plans for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient treatments and plans retrieved successfully' })
  async getPatientTreatments(
    @Param('patientId') patientId: string,
    @Request() req: RequestWithUser,
  ): Promise<{ treatments: Treatment[]; plans: TreatmentPlan[] }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.getPatientTreatments(patientId, tenantId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming treatments' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default: 30)' })
  @ApiResponse({ status: 200, description: 'Upcoming treatments retrieved successfully' })
  async getUpcomingTreatments(
    @Query('days') days: number = 30,
    @Request() req: RequestWithUser,
  ): Promise<Treatment[]> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.getUpcomingTreatments(tenantId, days);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue treatments' })
  @ApiResponse({ status: 200, description: 'Overdue treatments retrieved successfully' })
  async getOverdueTreatments(
    @Request() req: RequestWithUser,
  ): Promise<Treatment[]> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.treatmentService.getOverdueTreatments(tenantId);
  }

  // Helper method to get tenant ID from user
  private async getTenantIdFromUser(userId: string): Promise<string> {
    // This would typically come from a user service or JWT payload
    // For now, we'll use a placeholder - you'll need to implement this based on your auth system
    // In a real implementation, you would inject a UserService and get the tenant ID from the user
    return 'tenant-id'; // Replace with actual implementation
  }
}
