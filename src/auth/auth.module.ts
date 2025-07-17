import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/user/users.module';
import { TwoFactorService } from './two-factor.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantModule } from 'src/tenant/tenant.module';
import { StaffModule } from 'src/staff/staff.module';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { TwoFactorAuthGuard } from './guards/two-factor-auth.guard';

@Module({
  imports: [
    UsersModule, 
    MailModule,
    TenantModule,
    StaffModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRATION') 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TwoFactorService, AuthGuard, RefreshTokenGuard, TwoFactorAuthGuard],
  exports: [AuthService, TwoFactorService, AuthGuard, RefreshTokenGuard, TwoFactorAuthGuard],
})
export class AuthModule {}
