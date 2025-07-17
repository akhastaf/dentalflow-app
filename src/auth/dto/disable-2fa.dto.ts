import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class Disable2FADto {
    @ApiProperty({ 
        example: '123456', 
        description: 'Current 2FA code to confirm disable' 
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ 
        example: 'password123', 
        description: 'Current password to confirm disable' 
    })
    @IsString()
    @IsNotEmpty()
    password: string;
} 