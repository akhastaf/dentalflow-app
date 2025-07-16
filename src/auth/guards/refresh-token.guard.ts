import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { Request } from "express";
import { JwtPayload } from "src/types/jwt-payload";
import { UserService } from "src/user/users.service";

@Injectable()
export class RefreshTokenGuard implements CanActivate {

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const refreshToken: string = this.extractTokenFromCookies(request);
        
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            const jwtVerifyOptions: JwtVerifyOptions = {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            };
            
            const payload: JwtPayload = await this.jwtService.verify(refreshToken, jwtVerifyOptions);
            
            // Verify user exists and is active
            const user = await this.userService.findById(payload.sub);
            if (!user || !user.is_active) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Attach user to request for use in controller
            (request as any).user = user;
            
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        
        return true;
    }

    private extractTokenFromCookies(request: Request): string {
        return request.cookies?.refresh_token || '';
    }
} 