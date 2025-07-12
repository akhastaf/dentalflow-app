import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request, 
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { FilterPatientDto } from './dtos/filter-patient.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Patient } from './entities/patient.entity';
import { RequestWithUser } from '../types/request-with-user';
import { StaffService } from '../staff/staff.service';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly staffService: StaffService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ 
    status: 201, 
    description: 'Patient created successfully',
    type: Patient 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Patient with this phone number already exists' })
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @Request() req: RequestWithUser
  ): Promise<Patient> {
    // Get tenant ID from user's staff record
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.create(createPatientDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of patients',
    schema: {
      type: 'object',
      properties: {
        patients: {
          type: 'array',
          items: { $ref: '#/components/schemas/Patient' }
        },
        total: { type: 'number' }
      }
    }
  })
  async findAll(
    @Query() filters: FilterPatientDto,
    @Request() req: RequestWithUser
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.findAll(tenantId, filters);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all deleted patients' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of deleted patients',
    schema: {
      type: 'object',
      properties: {
        patients: {
          type: 'array',
          items: { $ref: '#/components/schemas/Patient' }
        },
        total: { type: 'number' }
      }
    }
  })
  async getDeletedPatients(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: RequestWithUser
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.getDeletedPatients(tenantId, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get patient statistics for the tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        male: { type: 'number' },
        female: { type: 'number' },
        thisMonth: { type: 'number' },
        deleted: { type: 'number' }
      }
    }
  })
  async getStats(@Request() req: RequestWithUser) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.getPatientStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient found',
    type: Patient 
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<Patient> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.findOne(id, tenantId);
  }

  @Get(':id/deleted')
  @ApiOperation({ summary: 'Get a patient by ID (including deleted patients)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient found (including deleted)',
    type: Patient 
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOneIncludingDeleted(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<Patient> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.getPatientByIdIncludingDeleted(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient updated successfully',
    type: Patient 
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @Request() req: RequestWithUser
  ): Promise<Patient> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.update(id, updatePatientDto, tenantId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient restored successfully',
    type: Patient 
  })
  @ApiResponse({ status: 404, description: 'Deleted patient not found' })
  @ApiResponse({ status: 409, description: 'Cannot restore: active patient with same phone exists' })
  async restorePatient(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<Patient> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.restorePatient(id, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a patient (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 204, description: 'Patient deleted successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.remove(id, tenantId);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a patient (cannot be undone)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 204, description: 'Patient permanently deleted' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async permanentlyDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.patientService.permanentlyDelete(id, tenantId);
  }

  private async getTenantIdFromUser(userId: string): Promise<string> {
    return this.staffService.getTenantIdByUserId(userId);
  }
}
