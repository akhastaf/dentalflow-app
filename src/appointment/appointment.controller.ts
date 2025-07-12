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
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dtos/create-appointment.dto';
import { FilterAppointmentsDto } from './dtos/filter-appointment.dto';
import { UpdateAppointmentDto } from './dtos/update-appointment.dto';
import { RescheduleAppointmentDto } from './dtos/reschedule-appointment.dto';
import { AppointmentStatus } from './dtos/create-appointment.dto';

@ApiTags('Appointments')
@Controller({
  path: 'appointments',
  version: '1'
})
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // 🟢 CREATE
  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  async create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  // 🔵 GET BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment found' })
  async findOne(@Param('id') id: string) {
    return this.appointmentService.findById(id);
  }

  // 🟣 LIST WITH FILTERS
  @Get()
  @ApiOperation({ summary: 'List appointments (with optional filters)' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async findAll(@Query() filters: FilterAppointmentsDto) {
    return this.appointmentService.findAll(filters);
  }

  // 🟠 UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, dto);
  }

  // 🔁 RESCHEDULE
  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentService.reschedule(id, dto);
  }

  // 🔄 UPDATE STATUS
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.appointmentService.updateStatus(id, status as AppointmentStatus);
  }

  // ♻️ RESTORE SOFT DELETED
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment restored' })
  async restore(@Param('id') id: string) {
    return this.appointmentService.restore(id);
  }

  // 🗑️ LIST SOFT DELETED
  @Get('deleted/list')
  @ApiOperation({ summary: 'List soft-deleted appointments' })
  @ApiResponse({ status: 200, description: 'List of deleted appointments' })
  async getDeleted() {
    return this.appointmentService.getDeletedAppointments();
  }

  // 🔴 DELETE (optional: you might archive instead)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }
}
