import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentService } from './attachment.service';
import { AttachmentController } from './attachment.controller';
import { Attachment } from './entities/attachment.entity';
import { MinioModule } from '../minio/minio.module';
import { StaffModule } from '../staff/staff.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment]), MinioModule, StaffModule, JwtModule, UsersModule],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService]
})
export class AttachmentsModule {}
