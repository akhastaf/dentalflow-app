import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { PaymentTreatment } from './entities/payment-treatment.entity';
import { Treatment } from '../treatment/entities/tratment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentTreatment, Treatment])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}
