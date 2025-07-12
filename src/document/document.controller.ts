import { Controller, Post, Get, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus, Res, Header, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { FilterDocumentDto } from './dtos/filter-document.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Document } from './entities/document.entity';
import { PdfService } from './pdf.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly pdfService: PdfService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a document for a patient' })
  @ApiResponse({ status: 201, type: Document })
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() currentUser: User
  ): Promise<Document> {
    return this.documentService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'List documents (by patient, filter, paginate)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query() filters: FilterDocumentDto,
    @CurrentUser() currentUser: User
  ) {
    return this.documentService.findAll(filters, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single document by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User
  ): Promise<Document> {
    return this.documentService.findOne(id, currentUser);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF for a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline')
  async generatePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @CurrentUser() currentUser: User
  ): Promise<void> {
    const document = await this.documentService.findOne(id, currentUser);
    const pdfBuffer = await this.pdfService.generateDocumentPdf(document);
    
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${document.getFileName()}"`);
    res.send(pdfBuffer);
  }

  @Get(':id/pdf/download')
  @ApiOperation({ summary: 'Download PDF for a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'PDF file download' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment')
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @CurrentUser() currentUser: User
  ): Promise<void> {
    const document = await this.documentService.findOne(id, currentUser);
    const pdfBuffer = await this.pdfService.generateDocumentPdf(document);
    
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${document.getFileName()}"`);
    res.send(pdfBuffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto
  ): Promise<Document> {
    return this.documentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (soft) a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.documentService.remove(id);
  }
}
