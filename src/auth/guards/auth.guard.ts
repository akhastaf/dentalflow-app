import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { RequestWithUser } from "src/types/request-with-user";
import { JwtPayload } from "src/types/jwt-payload";
import { UserService } from "src/user/users.service";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const request: RequestWithUser = context.switchToHttp().getRequest();
        const token: string = this.extractTokenFromHeader(request);
        if (!token){
            throw new UnauthorizedException()
        }
        try {
            const jwtVerifyOptions: JwtVerifyOptions = {
                secret: this.configService.get('JWT_SECRET'),
                ignoreExpiration: true,
            }
            const payload: JwtPayload = await this.jwtService.verify(token, jwtVerifyOptions)
            request.user = await this.userService.getUserByEmail(payload.email)
        } catch (e) {
            throw new UnauthorizedException()
        }
        return true;
    }

    private extractTokenFromHeader(request: RequestWithUser): string{
        const [type, token] = request.headers?.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : ''
    }
}