import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';
import { FileProcessingService } from './file-processing.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [MinioController],
  providers: [MinioService, FileProcessingService],
  exports: [MinioService, FileProcessingService],
})
export class MinioModule {} 