import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class Verify2FADto {
    @ApiProperty({ 
        example: '123456', 
        description: '2FA verification code' 
    })
    @IsString()
    @IsNotEmpty()
    code: string;
} 