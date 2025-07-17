import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { TwoFactorMethod } from '../../user/entities/user.entity';

export class Disable2FADto {
    @ApiProperty({ 
        example: 'password123', 
        description: 'Current password to confirm disable 2FA' 
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ 
        example: 'authenticator', 
        description: '2FA method to disable',
        enum: TwoFactorMethod
    })
    @IsEnum(TwoFactorMethod)
    @IsNotEmpty()
    method: TwoFactorMethod;
} 