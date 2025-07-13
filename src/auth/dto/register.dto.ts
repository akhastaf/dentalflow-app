import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'John', description: 'User first name' })
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @ApiProperty({ example: 'Doe', description: 'User last name' })
    @IsString()
    @IsNotEmpty()
    last_name: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    @IsNotEmpty()
    password: string;

    // Tenant information
    @ApiProperty({ example: 'Dental Clinic Dr. Smith', description: 'Clinic/tenant name' })
    @IsString()
    @IsNotEmpty()
    tenantName: string;

    @ApiProperty({ example: 'dental-clinic-dr-smith', description: 'Clinic slug for URL routing' })
    @IsString()
    @IsNotEmpty()
    tenantSlug: string;

    @ApiProperty({ example: '+212 5 22 34 56 78', description: 'Clinic phone number' })
    @IsString()
    @IsNotEmpty()
    tenantPhone: string;

    @ApiProperty({ example: '123 Avenue Mohammed V, Casablanca', description: 'Clinic address' })
    @IsString()
    @IsNotEmpty()
    tenantAddress: string;

    @ApiProperty({ example: 'Casablanca', description: 'Clinic city' })
    @IsString()
    @IsNotEmpty()
    tenantCity: string;


}