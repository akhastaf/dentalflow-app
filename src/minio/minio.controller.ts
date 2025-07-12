import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  Body, 
  UploadedFile, 
  UseInterceptors,
  BadRequestException,
  Res,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { MinioService } from './minio.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('File Storage')
@Controller({
  path: 'files',
  version: '1'
})
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a file with enhanced processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (images will be processed with multiple sizes)'
        },
        folder: {
          type: 'string',
          description: 'Optional folder path where to store the file'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully with UUID naming and image optimization' 
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.minioService.uploadFileWithProcessing(file, folder);

    return {
      uuid: result.uuid,
      originalName: result.originalName,
      safeName: result.safeName,
      urls: result.urls,
      size: result.size,
      isImage: result.isImage,
      metadata: result.metadata,
    };
  }

  @Get('download/*key')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    try {
      const fileBuffer = await this.minioService.downloadFile(key);
      
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        'Content-Length': fileBuffer.length,
      });
      
      res.send(fileBuffer);
    } catch (error) {
      throw new BadRequestException('File not found');
    }
  }

  @Get('url/*key')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get signed URL for file access' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  async getSignedUrl(@Param('key') key: string) {
    const signedUrl = await this.minioService.getSignedUrl(key);
    return { signedUrl };
  }

  @Delete('*key')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('key') key: string) {
    await this.minioService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  @Get('exists/*key')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if file exists' })
  @ApiResponse({ status: 200, description: 'File existence checked' })
  async fileExists(@Param('key') key: string) {
    const exists = await this.minioService.fileExists(key);
    return { exists };
  }

  @Post('replace/*key')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace a file with versioning' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New file to replace the existing one'
        },
        folder: {
          type: 'string',
          description: 'Optional folder path for the new file'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'File replaced successfully with backup created' 
  })
  @UseInterceptors(FileInterceptor('file'))
  async replaceFile(
    @Param('key') key: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.minioService.replaceFile(key, file, folder);

    return {
      uuid: result.uuid,
      originalName: result.originalName,
      safeName: result.safeName,
      urls: result.urls,
      size: result.size,
      isImage: result.isImage,
      metadata: result.metadata,
      message: 'File replaced successfully with backup created'
    };
  }

  @Get('info/*key')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file information and URLs for all versions' })
  @ApiResponse({ status: 200, description: 'File information retrieved' })
  async getFileInfo(@Param('key') key: string) {
    const fileInfo = await this.minioService.getFileInfo(key);
    return fileInfo;
  }
} 