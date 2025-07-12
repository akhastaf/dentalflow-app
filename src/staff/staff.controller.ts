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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dtos/create-staff.dto';
import { CreateStaffWithUserDto } from './dtos/create-staff-with-user.dto';
import { UpdateStaffDto } from './dtos/update-staff.dto';
import { FilterStaffDto } from './dtos/filter-staff.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Staff } from './entities/staff.entity';
import { RequestWithUser } from '../types/request-with-user';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff member (assign existing user)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Staff member created successfully',
    type: Staff 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User is already a staff member in this clinic' })
  async create(
    @Body() createStaffDto: CreateStaffDto,
    @Request() req: RequestWithUser
  ): Promise<Staff> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.create(createStaffDto, tenantId);
  }

  @Post('with-user')
  @ApiOperation({ summary: 'Create a new staff member with user account' })
  @ApiResponse({ 
    status: 201, 
    description: 'Staff member and user account created successfully',
    schema: {
      type: 'object',
      properties: {
        staff: { $ref: '#/components/schemas/Staff' },
        user: { $ref: '#/components/schemas/User' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async createWithUser(
    @Body() createStaffWithUserDto: CreateStaffWithUserDto,
    @Request() req: RequestWithUser
  ): Promise<{ staff: Staff; user: any }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.createWithUser(createStaffWithUserDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff members with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of staff members',
    schema: {
      type: 'object',
      properties: {
        staff: {
          type: 'array',
          items: { $ref: '#/components/schemas/Staff' }
        },
        total: { type: 'number' }
      }
    }
  })
  async findAll(
    @Query() filters: FilterStaffDto,
    @Request() req: RequestWithUser
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.findAll(tenantId, filters);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all deleted staff members' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of deleted staff members',
    schema: {
      type: 'object',
      properties: {
        staff: {
          type: 'array',
          items: { $ref: '#/components/schemas/Staff' }
        },
        total: { type: 'number' }
      }
    }
  })
  async getDeletedStaff(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: RequestWithUser
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.getDeletedStaff(tenantId, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get staff statistics for the tenant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Staff statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byRole: { 
          type: 'object',
          additionalProperties: { type: 'number' }
        }
      }
    }
  })
  async getStats(@Request() req: RequestWithUser) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.getStaffStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member by ID' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Staff member found',
    type: Staff 
  })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<Staff> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Staff member updated successfully',
    type: Staff 
  })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiResponse({ status: 409, description: 'User is already a staff member in this clinic' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @Request() req: RequestWithUser
  ): Promise<Staff> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.update(id, updateStaffDto, tenantId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted staff member' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Staff member restored successfully',
    type: Staff 
  })
  @ApiResponse({ status: 404, description: 'Deleted staff member not found' })
  async restoreStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<Staff> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.restoreStaff(id, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a staff member (soft delete)' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ status: 204, description: 'Staff member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.remove(id, tenantId);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a staff member (cannot be undone)' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ status: 204, description: 'Staff member permanently deleted' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async permanentlyDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.staffService.permanentlyDelete(id, tenantId);
  }

  private async getTenantIdFromUser(userId: string): Promise<string> {
    return this.staffService.getTenantIdByUserId(userId);
  }
}
