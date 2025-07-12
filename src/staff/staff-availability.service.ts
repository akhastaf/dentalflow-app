import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { StaffTimeRange, TimeRangeStatus } from './entities/staff-time-range.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { Staff } from './entities/staff.entity';
import { StaffService } from './staff.service';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

export interface DayAvailability {
  date: string;
  isWorkingDay: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  availableSlots: TimeSlot[];
  conflicts: Array<{
    type: 'appointment' | 'time_range';
    startTime: string;
    endTime: string;
    description: string;
  }>;
}

export interface AvailabilityRequest {
  staffId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  slotDuration?: number; // in minutes, default 30
  workingHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

@Injectable()
export class StaffAvailabilityService {
  constructor(
    @InjectRepository(StaffTimeRange)
    private readonly timeRangeRepo: Repository<StaffTimeRange>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly staffService: StaffService,
  ) {}

  async computeAvailability(request: AvailabilityRequest): Promise<DayAvailability[]> {
    const { staffId, startDate, endDate, slotDuration = 30, workingHours } = request;
    
    // Get staff information
    const staff = await this.staffService.findOne(staffId, request.tenantId);
    
    // Default working hours if not provided
    const defaultWorkingHours = {
      start: '09:00',
      end: '17:00'
    };
    
    const hours = workingHours || defaultWorkingHours;
    
    // Get all time ranges (breaks, vacations, etc.) for the staff
    const timeRanges = await this.timeRangeRepo.find({
      where: {
        staffId,
        tenantId: request.tenantId,
        deletedAt: IsNull(),
        status: TimeRangeStatus.APPROVED,
        startDate: MoreThanOrEqual(new Date(startDate)),
        endDate: LessThanOrEqual(new Date(endDate))
      }
    });

    // Get all appointments for the staff
    const appointments = await this.appointmentRepo.find({
      where: {
        doctorId: staffId,
        tenantId: request.tenantId,
        deletedAt: IsNull(),
        date: Between(startDate, endDate)
      }
    });

    // Generate availability for each day
    const availability: DayAvailability[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay() || 7; // Convert Sunday from 0 to 7
      
      const isWorkingDay = staff.workingDays.includes(dayOfWeek);
      
      if (!isWorkingDay) {
        availability.push({
          date: dateStr,
          isWorkingDay: false,
          workingHours: hours,
          availableSlots: [],
          conflicts: []
        });
        continue;
      }

      // Get conflicts for this specific day
      const dayTimeRanges = timeRanges.filter(tr => {
        const trStart = new Date(tr.startDate);
        const trEnd = new Date(tr.endDate);
        return date >= trStart && date <= trEnd;
      });

      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === date.toDateString();
      });

      // Generate all possible time slots for the day
      const allSlots = this.generateTimeSlots(hours.start, hours.end, slotDuration);
      
      // Filter out conflicting slots
      const availableSlots = this.filterAvailableSlots(allSlots, dayTimeRanges, dayAppointments);
      
      // Collect conflicts for reporting
      const conflicts = this.collectConflicts(dayTimeRanges, dayAppointments);

      availability.push({
        date: dateStr,
        isWorkingDay: true,
        workingHours: hours,
        availableSlots,
        conflicts
      });
    }

    return availability;
  }

  private generateTimeSlots(startTime: string, endTime: string, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    
    let current = start;
    while (current < end) {
      const slotEnd = Math.min(current + duration, end);
      slots.push({
        startTime: this.formatTime(current),
        endTime: this.formatTime(slotEnd),
        duration: slotEnd - current
      });
      current = slotEnd;
    }
    
    return slots;
  }

  private filterAvailableSlots(
    allSlots: TimeSlot[], 
    timeRanges: StaffTimeRange[], 
    appointments: Appointment[]
  ): TimeSlot[] {
    return allSlots.filter(slot => {
      // Check if slot conflicts with any time range
      const hasTimeRangeConflict = timeRanges.some(tr => {
        if (!tr.startTime || !tr.endTime) {
          // Full day time range (vacation, etc.)
          return true;
        }
        
        const trStart = this.parseTime(tr.startTime);
        const trEnd = this.parseTime(tr.endTime);
        const slotStart = this.parseTime(slot.startTime);
        const slotEnd = this.parseTime(slot.endTime);
        
        return (slotStart < trEnd && slotEnd > trStart);
      });

      if (hasTimeRangeConflict) return false;

      // Check if slot conflicts with any appointment
      const hasAppointmentConflict = appointments.some(apt => {
        const aptStart = this.parseTime(apt.startTime);
        const aptEnd = this.parseTime(apt.endTime);
        const slotStart = this.parseTime(slot.startTime);
        const slotEnd = this.parseTime(slot.endTime);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });

      return !hasAppointmentConflict;
    });
  }

  private collectConflicts(timeRanges: StaffTimeRange[], appointments: Appointment[]) {
    const conflicts: DayAvailability['conflicts'] = [];

    // Add time range conflicts
    timeRanges.forEach(tr => {
      conflicts.push({
        type: 'time_range',
        startTime: tr.startTime || '00:00',
        endTime: tr.endTime || '23:59',
        description: `${tr.type}: ${tr.description || 'No description'}`
      });
    });

    // Add appointment conflicts
    appointments.forEach(apt => {
      conflicts.push({
        type: 'appointment',
        startTime: apt.startTime,
        endTime: apt.endTime,
        description: `Appointment with ${apt.patient?.fullName || 'Patient'}`
      });
    });

    return conflicts;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  async getNextAvailableSlot(
    staffId: string, 
    tenantId: string, 
    date: string, 
    preferredTime?: string,
    slotDuration: number = 30
  ): Promise<TimeSlot | null> {
    const availability = await this.computeAvailability({
      staffId,
      tenantId,
      startDate: date,
      endDate: date,
      slotDuration
    });

    const dayAvailability = availability[0];
    if (!dayAvailability || !dayAvailability.isWorkingDay || dayAvailability.availableSlots.length === 0) {
      return null;
    }

    if (preferredTime) {
      // Find the first available slot after the preferred time
      const preferredMinutes = this.parseTime(preferredTime);
      const preferredSlot = dayAvailability.availableSlots.find(slot => {
        const slotStart = this.parseTime(slot.startTime);
        return slotStart >= preferredMinutes;
      });
      
      return preferredSlot || dayAvailability.availableSlots[0];
    }

    return dayAvailability.availableSlots[0];
  }

  async getAvailableSlotsForDateRange(
    staffId: string,
    tenantId: string,
    startDate: string,
    endDate: string,
    slotDuration: number = 30
  ): Promise<{
    totalAvailableSlots: number;
    availableDays: number;
    slotsByDay: Record<string, TimeSlot[]>;
  }> {
    const availability = await this.computeAvailability({
      staffId,
      tenantId,
      startDate,
      endDate,
      slotDuration
    });

    const slotsByDay: Record<string, TimeSlot[]> = {};
    let totalAvailableSlots = 0;
    let availableDays = 0;

    availability.forEach(day => {
      if (day.isWorkingDay && day.availableSlots.length > 0) {
        slotsByDay[day.date] = day.availableSlots;
        totalAvailableSlots += day.availableSlots.length;
        availableDays++;
      }
    });

    return {
      totalAvailableSlots,
      availableDays,
      slotsByDay
    };
  }
} 