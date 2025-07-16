import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserService } from '../../user/users.service';

@Injectable()
export class TwoFactorAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('2FA token is required');
    }

    try {
      // Verify the 2FA pre-auth token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_2FA_SECRET'),
      });

      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new UnauthorizedException('2FA token has expired');
      }

      // Verify the user exists and has 2FA enabled
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.twoFactorAuthenticatorEnabled && !user.twoFactorEmailEnabled) {
        throw new UnauthorizedException('2FA is not enabled for this account');
      }

      // Attach user to request for use in controller
      request['user'] = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid 2FA token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 