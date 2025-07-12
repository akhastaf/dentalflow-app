import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ 
        example: 'john.doe@example.com', 
        description: 'Email address to send password reset link to' 
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
} 