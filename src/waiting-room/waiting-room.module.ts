import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingRoomService } from './waiting-room.service';
import { WaitingRoomController } from './waiting-room.controller';
import { WaitingRoom } from './entities/waiting-room.entity';
import { PatientModule } from '../patient/patient.module';
import { StaffModule } from '../staff/staff.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaitingRoom]),
    PatientModule,
    StaffModule,
    JwtModule,
    UsersModule
  ],
  controllers: [WaitingRoomController],
  providers: [WaitingRoomService],
  exports: [WaitingRoomService],
})
export class WaitingRoomModule {} 