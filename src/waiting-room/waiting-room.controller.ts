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
import { WaitingRoomService } from './waiting-room.service';
import { CreateWaitingRoomDto } from './dtos/create-waiting-room.dto';
import { UpdateWaitingRoomDto } from './dtos/update-waiting-room.dto';
import { FilterWaitingRoomDto } from './dtos/filter-waiting-room.dto';
import { CallPatientDto } from './dtos/call-patient.dto';
import { CancelPatientDto } from './dtos/cancel-patient.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RequestWithUser } from '../types/request-with-user';
import { StaffService } from '../staff/staff.service';

@Controller('waiting-room')
@UseGuards(AuthGuard)
export class WaitingRoomController {
  constructor(
    private readonly waitingRoomService: WaitingRoomService,
    private readonly staffService: StaffService,
  ) {}

  @Post()
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
  async findAll(
    @Query() filterDto: FilterWaitingRoomDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.findAll(tenantId, filterDto);
  }

  @Get('statistics')
  async getStatistics(@Request() req: RequestWithUser) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.getStatistics(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.findOne(id, tenantId);
  }

  @Patch(':id')
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
  async reorder(
    @Param('id') id: string,
    @Body() reorderData: { id: string; newOrder: number }[],
    @Request() req: RequestWithUser,
  ) {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return await this.waitingRoomService.reorder(tenantId, reorderData);
  }

  @Delete(':id')
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