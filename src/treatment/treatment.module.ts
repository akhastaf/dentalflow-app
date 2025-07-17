import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from './treatment.service';
import { Treatment } from './entities/tratment.entity';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { TenantTreatment } from './entities/tenant-treatment.entity';
import { TreatmentReference } from './entities/treatment-ref.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Treatment,
      TreatmentPlan,
      TenantTreatment,
      TreatmentReference,
    ]),
    JwtModule,
    UsersModule
  ],
  controllers: [TreatmentController],
  providers: [TreatmentService],
  exports: [TreatmentService],
})
export class TreatmentModule {} 