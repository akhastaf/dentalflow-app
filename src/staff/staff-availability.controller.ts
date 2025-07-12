import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffAvailabilityService, DayAvailability, TimeSlot } from './staff-availability.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StaffService } from './staff.service';
import { RequestWithUser } from '../types/request-with-user';

@ApiTags('Staff Availability')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('staff-availability')
export class StaffAvailabilityController {
  constructor(
    private readonly availabilityService: StaffAvailabilityService,
    private readonly staffService: StaffService,
  ) {}

  @Get(':staffId/compute')
  @ApiOperation({ summary: 'Compute available slots for a staff member' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'slotDuration', required: false, description: 'Slot duration in minutes (default: 30)' })
  @ApiQuery({ name: 'workingHoursStart', required: false, description: 'Working hours start (HH:MM, default: 09:00)' })
  @ApiQuery({ name: 'workingHoursEnd', required: false, description: 'Working hours end (HH:MM, default: 17:00)' })
  @ApiResponse({ status: 200, description: 'Availability computed successfully' })
  async computeAvailability(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
    @Query('slotDuration') slotDuration?: number,
    @Query('workingHoursStart') workingHoursStart?: string,
    @Query('workingHoursEnd') workingHoursEnd?: string,
  ): Promise<DayAvailability[]> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    
    const workingHours = workingHoursStart && workingHoursEnd ? {
      start: workingHoursStart,
      end: workingHoursEnd
    } : undefined;

    return this.availabilityService.computeAvailability({
      staffId,
      tenantId,
      startDate,
      endDate,
      slotDuration: slotDuration || 30,
      workingHours
    });
  }

  @Get(':staffId/next-available')
  @ApiOperation({ summary: 'Get next available slot for a staff member' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'preferredTime', required: false, description: 'Preferred time (HH:MM)' })
  @ApiQuery({ name: 'slotDuration', required: false, description: 'Slot duration in minutes (default: 30)' })
  @ApiResponse({ status: 200, description: 'Next available slot found' })
  @ApiResponse({ status: 404, description: 'No available slots found' })
  async getNextAvailableSlot(
    @Param('staffId') staffId: string,
    @Query('date') date: string,
    @Request() req: RequestWithUser,
    @Query('preferredTime') preferredTime?: string,
    @Query('slotDuration') slotDuration?: number,
  ): Promise<TimeSlot | null> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    
    return this.availabilityService.getNextAvailableSlot(
      staffId,
      tenantId,
      date,
      preferredTime,
      slotDuration || 30
    );
  }

  @Get(':staffId/slots-summary')
  @ApiOperation({ summary: 'Get summary of available slots for a date range' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'slotDuration', required: false, description: 'Slot duration in minutes (default: 30)' })
  @ApiResponse({ status: 200, description: 'Slots summary retrieved successfully' })
  async getSlotsSummary(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
    @Query('slotDuration') slotDuration?: number,
  ): Promise<{
    totalAvailableSlots: number;
    availableDays: number;
    slotsByDay: Record<string, TimeSlot[]>;
  }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    
    return this.availabilityService.getAvailableSlotsForDateRange(
      staffId,
      tenantId,
      startDate,
      endDate,
      slotDuration || 30
    );
  }

  @Get(':staffId/quick-check')
  @ApiOperation({ summary: 'Quick check if staff is available at a specific time' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startTime', required: true, description: 'Start time (HH:MM)' })
  @ApiQuery({ name: 'endTime', required: true, description: 'End time (HH:MM)' })
  @ApiResponse({ status: 200, description: 'Availability check completed' })
  async quickAvailabilityCheck(
    @Param('staffId') staffId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Request() req: RequestWithUser,
  ): Promise<{
    available: boolean;
    conflicts: Array<{
      type: 'appointment' | 'time_range';
      startTime: string;
      endTime: string;
      description: string;
    }>;
  }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    
    // Get staff availability for the specific date
    const availability = await this.availabilityService.computeAvailability({
      staffId,
      tenantId,
      startDate: date,
      endDate: date,
      slotDuration: 1 // 1 minute slots for precise checking
    });

    const dayAvailability = availability[0];
    if (!dayAvailability || !dayAvailability.isWorkingDay) {
      return {
        available: false,
        conflicts: [{
          type: 'time_range',
          startTime: '00:00',
          endTime: '23:59',
          description: 'Not a working day'
        }]
      };
    }

    // Check if the requested time slot conflicts with any existing conflicts
    const requestedStart = this.parseTime(startTime);
    const requestedEnd = this.parseTime(endTime);
    
    const conflicts = dayAvailability.conflicts.filter(conflict => {
      const conflictStart = this.parseTime(conflict.startTime);
      const conflictEnd = this.parseTime(conflict.endTime);
      
      return (requestedStart < conflictEnd && requestedEnd > conflictStart);
    });

    return {
      available: conflicts.length === 0,
      conflicts
    };
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async getTenantIdFromUser(userId: string): Promise<string> {
    return this.staffService.getTenantIdByUserId(userId);
  }
} 