import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ 
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
        description: 'Password reset token received via email' 
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ 
        example: 'newSecurePassword123', 
        description: 'New password (minimum 8 characters)',
        minLength: 8
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
} 