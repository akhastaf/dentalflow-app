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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { WaitingRoomService } from './waiting-room.service';
import { CreateWaitingRoomDto } from './dtos/create-waiting-room.dto';
import { UpdateWaitingRoomDto } from './dtos/update-waiting-room.dto';
import { FilterWaitingRoomDto } from './dtos/filter-waiting-room.dto';
import { CancelPatientDto } from './dtos/cancel-patient.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RequestWithUser } from '../types/request-with-user';
import { StaffService } from '../staff/staff.service';
import { CallPatientDto } from './dtos/call-patient.dto';

@ApiTags('Waiting Room')
@Controller('waiting-room')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class WaitingRoomController {
  constructor(
    private readonly waitingRoomService: WaitingRoomService,
    private readonly staffService: StaffService,
  ) {}

  @Post()

  @ApiOperation({
    summary: 'Add patient to waiting room,',
    description: 'Add a new patient to the waiting room with optional doctor assignment and priority'
  })
  @ApiResponse({
    status: 201,
    description: 'Patient successfully added to waiting room',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4o5p6' },
        patientId: { type: 'string', example: 'b2c34-e5f6-g7h8-i9j0-k1l2m3n4o5p6' },
        status: { type: 'string', example: 'waiting' },
        order: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Patient or doctor not found' })

  async create(
    @Body() createWaitingRoomDto: CreateWaitingRoomDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.create(
      tenantId,
      createWaitingRoomDto,
      req.user.user_id,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all patients in waiting room,',
    description: 'Retrieve all patients in the waiting room with optional filtering and pagination'
  })
  @ApiResponse({
    status: 200,
    description: 'List of patients in waiting room retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              patientId: { type: 'string' },
              status: { type: 'string' },
              order: { type: 'number' },
              emergencyLevel: { type: 'string' },
              assignedDoctorId: { type: 'string' },
              notes: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })

  async findAll(
    @Query() filterDto: FilterWaitingRoomDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.findAll(tenantId, filterDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get waiting room statistics,',
    description: 'Retrieve statistics about patients in the waiting room (counts by status, emergency levels, etc.)'
  })
  @ApiResponse({
    status: 200,
    description: 'Waiting room statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 15 },
        byStatus: {
          type: 'object',
          properties: {
            waiting: { type: 'number', example: 8 },
            called: { type: 'number', example: 3 },
            in_consultation: { type: 'number', example: 2 },
            completed: { type: 'number', example: 1 },
            cancelled: { type: 'number', example: 1 }
          }
        },
        byEmergencyLevel: {
          type: 'object',
          properties: {
            normal: { type: 'number', example: 10 },
            urgent: { type: 'number', example: 3 },
            emergency: { type: 'number', example: 2 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })

  async getStatistics(@Request() req: RequestWithUser) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.getStatistics(tenantId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get patient in waiting room by ID,',
    description: 'Retrieve detailed information about a specific patient in the waiting room'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Patient in waiting room retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        patientId: { type: 'string' },
        status: { type: 'string' },
        order: { type: 'number' },
        emergencyLevel: { type: 'string' },
        assignedDoctorId: { type: 'string' },
        notes: { type: 'string' },
        calledAt: { type: 'string', format: 'date-time' },
        consultationStartedAt: { type: 'string', format: 'date-time' },
        consultationEndedAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update patient in waiting room,',
    description: 'Update information about a patient in the waiting room (status, doctor assignment, notes, etc.)'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Patient in waiting room updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        patientId: { type: 'string' },
        status: { type: 'string' },
        order: { type: 'number' },
        emergencyLevel: { type: 'string' },
        assignedDoctorId: { type: 'string' },
        notes: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async update(
    @Param('id') id: string,
    @Body() updateWaitingRoomDto: UpdateWaitingRoomDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.update(
      id,
      tenantId,
      updateWaitingRoomDto,
      req.user.user_id,
    );
  }

  @Post(':id/call')
  @ApiOperation({
    summary: 'Call patient from waiting room,',
    description: 'Mark a patient as called and ready for consultation'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Patient called successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', example: 'called' },
        calledAt: { type: 'string', format: 'date-time' },
        calledBy: { type: 'string' },
        notes: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Patient already called or in consultation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async callPatient(
    @Param('id') id: string,
    @Body() callPatientDto: CallPatientDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.callPatient(
      id,
      tenantId,
      callPatientDto,
      req.user.user_id,
    );
  }

  @Post(':id/start-consultation')
  @ApiOperation({
    summary: 'Start consultation with patient,',
    description: 'Mark that consultation has started with the patient'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Consultation started successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', example: 'in_consultation' },
        consultationStartedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Patient not called or already in consultation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async startConsultation(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.startConsultation(
      id,
      tenantId,
      req.user.user_id,
    );
  }

  @Post(':id/complete-consultation')
  @ApiOperation({
    summary: 'Complete consultation with patient,',
    description: 'Mark that consultation has been completed with the patient'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Consultation completed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', example: 'completed' },
        consultationEndedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Patient not in consultation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async completeConsultation(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.completeConsultation(
      id,
      tenantId,
      req.user.user_id,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel patient from waiting room,',
    description: 'Cancel a patient from the waiting room with optional reason'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Patient cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', example: 'cancelled' },
        cancelledAt: { type: 'string', format: 'date-time' },
        cancelledBy: { type: 'string' },
        cancellationReason: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Patient already completed or cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async cancelPatient(
    @Param('id') id: string,
    @Body() cancelPatientDto: CancelPatientDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.cancelPatient(
      id,
      tenantId,
      cancelPatientDto,
      req.user.user_id,
    );
  }

  @Post(':id/reorder')
  @ApiOperation({
    summary: 'Reorder patients in waiting room,',
    description: 'Updatethe order/priority of multiple patients in the waiting room'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID (not used in reorder operation),',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n46'
  })
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Waiting room entry ID' },
          newOrder: { type: 'number', description: 'New order/priority number' }
        }
      },
      example: [
        { id: 'a1b2c34-e5f6-g7h8-i9k1l2m3n4o5p6', newOrder: 1 },
        { id: 'b2c34-e5f6-g7h8-i9k1l2m3n4o5p6', newOrder: 2 }
      ]
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Patients reordered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Patients reordered successfully' },
        updatedCount: { type: 'number', example: 2 }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })

  async reorder(
    @Param('id') id: string,
    @Body() reorderData: { id: string; newOrder: number }[],
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.reorder(tenantId, reorderData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove patient from waiting room,',
    description: 'Permanently remove a patient from the waiting room (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'Waiting room entry ID,',
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4'
  })
  @ApiResponse({
    status: 200,
    description: 'Patient removed from waiting room successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Patient removed from waiting room' },
        id: { type: 'string' },
        deletedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Waiting room entry not found' })

  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.remove(id, tenantId, req.user.user_id);
  }

  private async getTenantIdFromUser(userId: string): Promise<string> {
    return await this.staffService.getTenantIdByUserId(userId);
  }
} 