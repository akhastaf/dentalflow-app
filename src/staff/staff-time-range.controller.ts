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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffTimeRangeService } from './staff-time-range.service';
import { CreateStaffTimeRangeDto } from './dtos/create-staff-time-range.dto';
import { UpdateStaffTimeRangeDto } from './dtos/update-staff-time-range.dto';
import { FilterStaffTimeRangeDto } from './dtos/filter-staff-time-range.dto';
import { StaffTimeRange } from './entities/staff-time-range.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StaffService } from './staff.service';
import { RequestWithUser } from '../types/request-with-user';

@ApiTags('Staff Time Ranges')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('staff-time-ranges')
export class StaffTimeRangeController {
  constructor(
    private readonly staffTimeRangeService: StaffTimeRangeService,
    private readonly staffService: StaffService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff time range' })
  @ApiResponse({ status: 201, description: 'Time range created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Time range conflicts with existing schedule' })
  async create(
    @Body() createStaffTimeRangeDto: CreateStaffTimeRangeDto,
    @Request() req: RequestWithUser,
  ): Promise<StaffTimeRange> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.create(createStaffTimeRangeDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff time ranges with filters' })
  @ApiResponse({ status: 200, description: 'Time ranges retrieved successfully' })
  async findAll(
    @Query() filters: FilterStaffTimeRangeDto,
    @Request() req: RequestWithUser,
  ): Promise<{ timeRanges: StaffTimeRange[]; total: number }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.findAll(tenantId, filters);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get time ranges for a specific staff member' })
  @ApiResponse({ status: 200, description: 'Staff time ranges retrieved successfully' })
  async findByStaffId(
    @Param('staffId') staffId: string,
    @Query() filters: FilterStaffTimeRangeDto,
    @Request() req: RequestWithUser,
  ): Promise<{ timeRanges: StaffTimeRange[]; total: number }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.getStaffTimeRangesByStaffId(staffId, tenantId, filters);
  }

  @Get('availability/:staffId')
  @ApiOperation({ summary: 'Check staff availability for a date range' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  async checkAvailability(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
  ): Promise<{ available: boolean; conflicts: StaffTimeRange[]; workingDays: number[] }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.getStaffAvailability(staffId, tenantId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific staff time range' })
  @ApiResponse({ status: 200, description: 'Time range retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Time range not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<StaffTimeRange> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff time range' })
  @ApiResponse({ status: 200, description: 'Time range updated successfully' })
  @ApiResponse({ status: 404, description: 'Time range not found' })
  @ApiResponse({ status: 409, description: 'Time range conflicts with existing schedule' })
  async update(
    @Param('id') id: string,
    @Body() updateStaffTimeRangeDto: UpdateStaffTimeRangeDto,
    @Request() req: RequestWithUser,
  ): Promise<StaffTimeRange> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.update(id, updateStaffTimeRangeDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff time range' })
  @ApiResponse({ status: 200, description: 'Time range deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time range not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.remove(id, tenantId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a staff time range request' })
  @ApiResponse({ status: 200, description: 'Time range approved successfully' })
  @ApiResponse({ status: 404, description: 'Time range not found' })
  async approve(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<StaffTimeRange> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.approveTimeRange(id, tenantId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a staff time range request' })
  @ApiResponse({ status: 200, description: 'Time range rejected successfully' })
  @ApiResponse({ status: 404, description: 'Time range not found' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: RequestWithUser,
  ): Promise<StaffTimeRange> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.rejectTimeRange(id, tenantId, body.reason);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a staff time range' })
  @ApiResponse({ status: 200, description: 'Time range cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Time range not found' })
  async cancel(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<StaffTimeRange> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffTimeRangeService.cancelTimeRange(id, tenantId);
  }

  private async getTenantIdFromUser(userId: string): Promise<string> {
    return this.staffService.getTenantIdByUserId(userId);
  }
} 