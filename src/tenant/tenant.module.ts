import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Patient } from '../patient/entities/patient.entity';
import { PatientService } from '../patient/patient.service';
import { Appointment } from '../appointment/entities/appointment.entity';
import { AppointmentService } from '../appointment/appointment.service';
import { Staff } from '../staff/entities/staff.entity';
import { Payment } from '../payment/entities/payment.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Patient, Appointment, Staff, Payment]), JwtModule, UsersModule],
  controllers: [TenantController],
  providers: [TenantService, PatientService, AppointmentService],
  exports: [TenantService],
})
export class TenantModule {}
