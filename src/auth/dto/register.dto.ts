import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsOptional, Matches, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'email must be a valid email address' })
    @IsNotEmpty({ message: 'email is required' })
    email: string;

    @ApiProperty({ example: 'John', description: 'User first name' })
    @IsString({ message: 'first_name must be a string' })
    @IsNotEmpty({ message: 'first_name is required' })
    first_name: string;

    @ApiProperty({ example: 'Doe', description: 'User last name' })
    @IsString({ message: 'last_name must be a string' })
    @IsNotEmpty({ message: 'last_name is required' })
    last_name: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString({ message: 'password must be a string' })
    @IsNotEmpty({ message: 'password is required' })
    @MinLength(8, { message: 'password must be at least 8 characters long' })
    @Matches(/(?=.*[a-z])/, { message: 'password must contain at least one lowercase letter' })
    @Matches(/(?=.*[A-Z])/, { message: 'password must contain at least one uppercase letter' })
    @Matches(/(?=.*\d)/, { message: 'password must contain at least one number' })
    password: string;

    // Tenant information
    @ApiProperty({ example: 'Dental Clinic Dr. Smith', description: 'Clinic/tenant name' })
    @IsString({ message: 'tenantName must be a string' })
    @IsNotEmpty({ message: 'tenantName is required' })
    tenantName: string;

    @ApiProperty({ example: 'dental-clinic-dr-smith', description: 'Clinic slug for URL routing' })
    @IsString({ message: 'tenantSlug must be a string' })
    @IsNotEmpty({ message: 'tenantSlug is required' })
    @Matches(/^[a-z0-9-]+$/, { message: 'tenantSlug can only contain lowercase letters, numbers, and hyphens' })
    tenantSlug: string;

    @ApiProperty({ example: '+212 5 22 34 56 78', description: 'Clinic phone number' })
    @IsString({ message: 'tenantPhone must be a string' })
    @IsNotEmpty({ message: 'tenantPhone is required' })
    tenantPhone: string;

    @ApiProperty({ example: '123 Avenue Mohammed V, Casablanca', description: 'Clinic address' })
    @IsString({ message: 'tenantAddress must be a string' })
    @IsNotEmpty({ message: 'tenantAddress is required' })
    tenantAddress: string;

    @ApiProperty({ example: 'Casablanca', description: 'Clinic city' })
    @IsString({ message: 'tenantCity must be a string' })
    @IsNotEmpty({ message: 'tenantCity is required' })
    tenantCity: string;
}