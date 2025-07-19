import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { StaffTimeRangeService } from './staff-time-range.service';
import { StaffTimeRangeController } from './staff-time-range.controller';
import { StaffAvailabilityService } from './staff-availability.service';
import { StaffAvailabilityController } from './staff-availability.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { StaffTimeRange } from './entities/staff-time-range.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';
import { MailModule } from '../mail/mail.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, StaffTimeRange, Appointment]), 
    JwtModule, 
    UsersModule,
    MailModule,
    TenantModule
  ],
  controllers: [StaffController, StaffTimeRangeController, StaffAvailabilityController],
  providers: [StaffService, StaffTimeRangeService, StaffAvailabilityService],
  exports: [StaffService, StaffTimeRangeService, StaffAvailabilityService]
})
export class StaffModule {}
