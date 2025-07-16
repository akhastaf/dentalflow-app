import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm';
import { UsersModule } from './user/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { PatientModule } from './patient/patient.module';
import { AppointmentsModule } from './appointment/appointment.module';
import { TreatmentModule } from './treatment/treatment.module';
import { PaymentsModule } from './payment/payment.module';
import { ExpenseModule } from './expense/expense.module';
import { StocksModule } from './stock/stocks.module';
import { DocumentsModule } from './document/document.module';
import { AttachmentsModule } from './attachments/attachment.module';
import { StaffModule } from './staff/staff.module';
import { TenantModule } from './tenant/tenant.module';
import { CaslAbilityModule } from './casl/casl-ability.module';
import { MinioModule } from './minio/minio.module';
import { WaitingRoomModule } from './waiting-room/waiting-room.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    UsersModule,
    AuthModule,
    // NotificationsModule,
    TenantModule,
    PatientModule,
    AppointmentsModule,
    PaymentsModule,
    ExpenseModule,
    StocksModule,
    DocumentsModule,
    AttachmentsModule,
    StaffModule,
    CaslAbilityModule,
    MinioModule,
    TreatmentModule,
    WaitingRoomModule,
    // InventoriesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
