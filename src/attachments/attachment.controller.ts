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
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AttachmentService } from './attachment.service';
import { CreateAttachmentDto } from './dtos/create-attachment.dto';
import { UpdateAttachmentDto } from './dtos/update-attachment.dto';
import { FilterAttachmentDto } from './dtos/filter-attachment.dto';
import { Attachment } from './entities/attachment.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StaffService } from '../staff/staff.service';
import { RequestWithUser } from '../types/request-with-user';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('attachments')
export class AttachmentController {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly staffService: StaffService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a new attachment for a patient' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload'
        },
        patientId: {
          type: 'string',
          description: 'Patient ID'
        },
        description: {
          type: 'string',
          description: 'Optional description'
        }
      },
      required: ['file', 'patientId']
    }
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body() createAttachmentDto: CreateAttachmentDto,
    @Request() req: RequestWithUser,
  ): Promise<Attachment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    
    return this.attachmentService.uploadAttachment(
      file,
      createAttachmentDto.patientId,
      tenantId,
      createAttachmentDto.description,
      req.user.user_id
    );
  }

  @Post('upload/:patientId')
  @ApiOperation({ summary: 'Upload attachment for a specific patient' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload'
        },
        description: {
          type: 'string',
          description: 'Optional description'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachmentForPatient(
    @Param('patientId') patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { description?: string },
    @Request() req: RequestWithUser,
  ): Promise<Attachment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    
    return this.attachmentService.uploadAttachment(
      file,
      patientId,
      tenantId,
      body.description,
      req.user.user_id
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all attachments with filters' })
  @ApiResponse({ status: 200, description: 'Attachments retrieved successfully' })
  async findAll(
    @Query() filters: FilterAttachmentDto,
    @Request() req: RequestWithUser,
  ): Promise<{ attachments: Attachment[]; total: number }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.findAll(tenantId, filters);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get attachments for a specific patient' })
  @ApiResponse({ status: 200, description: 'Patient attachments retrieved successfully' })
  async findByPatientId(
    @Param('patientId') patientId: string,
    @Query() filters: FilterAttachmentDto,
    @Request() req: RequestWithUser,
  ): Promise<{ attachments: Attachment[]; total: number }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.findByPatientId(patientId, tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific attachment' })
  @ApiResponse({ status: 200, description: 'Attachment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Attachment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.findOne(id, tenantId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL for an attachment' })
  @ApiResponse({ status: 200, description: 'Download URL generated successfully' })
  async getDownloadUrl(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ downloadUrl: string }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    const downloadUrl = await this.attachmentService.getFileDownloadUrl(id, tenantId);
    return { downloadUrl };
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get preview URL for an attachment' })
  @ApiResponse({ status: 200, description: 'Preview URL generated successfully' })
  async getPreviewUrl(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ previewUrl: string }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    const previewUrl = await this.attachmentService.getFilePreviewUrl(id, tenantId);
    return { previewUrl };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attachment' })
  @ApiResponse({ status: 200, description: 'Attachment updated successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
    @Request() req: RequestWithUser,
  ): Promise<Attachment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.update(id, updateAttachmentDto, tenantId);
  }

  @Post(':id/replace')
  @ApiOperation({ summary: 'Replace an attachment with a new file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New file to replace the attachment'
        },
        description: {
          type: 'string',
          description: 'Optional new description'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ status: 200, description: 'Attachment replaced successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async replaceAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { description?: string },
    @Request() req: RequestWithUser,
  ): Promise<Attachment> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.replaceAttachment(id, file, tenantId, body.description);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiResponse({ status: 204, description: 'Attachment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.remove(id, tenantId);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get attachment statistics for the tenant' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req: RequestWithUser): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.getAttachmentStats(tenantId);
  }

  @Get('stats/patient/:patientId')
  @ApiOperation({ summary: 'Get attachment statistics for a specific patient' })
  @ApiResponse({ status: 200, description: 'Patient statistics retrieved successfully' })
  async getPatientStats(
    @Param('patientId') patientId: string,
    @Request() req: RequestWithUser,
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const tenantId = await this.getTenantIdFromUser(req.user.user_id);
    return this.attachmentService.getPatientAttachmentStats(patientId, tenantId);
  }

  private async getTenantIdFromUser(userId: string): Promise<string> {
    return this.staffService.getTenantIdByUserId(userId);
  }
}
