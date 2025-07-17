import { Module } from '@nestjs/common';
import { TreatmentController } from './treatments.controller';
import { TreatmentService } from './treatments.service';

@Module({
  controllers: [TreatmentController],
  providers: [TreatmentService],
  exports: [TreatmentService]
})
export class TreatmentsModule {}
