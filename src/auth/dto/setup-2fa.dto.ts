import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { TwoFactorMethod } from '../../user/entities/user.entity';

export class Setup2FADto {
    @ApiProperty({ 
        enum: TwoFactorMethod, 
        example: TwoFactorMethod.AUTHENTICATOR,
        description: '2FA method to enable' 
    })
    @IsEnum(TwoFactorMethod)
    @IsNotEmpty()
    method: TwoFactorMethod;
} 