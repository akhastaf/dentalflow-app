import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'email must be a valid email address' })
    @IsNotEmpty({ message: 'email is required' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString({ message: 'password must be a string' })
    @IsNotEmpty({ message: 'password is required' })
    password: string;
}