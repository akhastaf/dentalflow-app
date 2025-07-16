import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { TwoFactorMethod } from '../../user/entities/user.entity';

export class Verify2FADto {
    @ApiProperty({ 
        example: '123456', 
        description: '2FA verification code' 
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ 
        example: 'authenticator', 
        description: '2FA method being verified',
        enum: TwoFactorMethod
    })
    @IsEnum(TwoFactorMethod)
    @IsNotEmpty()
    method: TwoFactorMethod;
} 