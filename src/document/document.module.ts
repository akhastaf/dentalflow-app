import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PdfService } from './pdf.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Staff } from '../staff/entities/staff.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Staff]), JwtModule, UsersModule],
  controllers: [DocumentController],
  providers: [DocumentService, PdfService],
  exports: [DocumentService, PdfService],
})
export class DocumentsModule {}
