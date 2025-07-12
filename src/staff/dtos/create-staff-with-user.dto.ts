import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsNumber, IsOptional, IsEmail, Min, Max, MinLength } from 'class-validator';
import { StaffRole, SalaryType } from '../entities/staff.entity';

export class CreateStaffWithUserDto {
  // User Information
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @MinLength(2)
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @MinLength(2)
  last_name: string;

  // Staff Information
  @ApiProperty({ enum: StaffRole, description: 'Role assigned to the staff member' })
  @IsEnum(StaffRole)
  role: StaffRole;

  @ApiProperty({ 
    example: [1, 2, 3, 4, 5], 
    description: 'Working days (1=Monday, 2=Tuesday, etc.)',
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workingDays: number[];

  @ApiProperty({ enum: SalaryType, description: 'Type of salary calculation' })
  @IsEnum(SalaryType)
  salaryType: SalaryType;

  @ApiProperty({ 
    example: 5000.00, 
    description: 'Salary amount (fixed amount or percentage base)',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  salaryAmount: number;

  @ApiPropertyOptional({ 
    example: ['patient_read', 'patient_write', 'appointment_read'],
    description: 'Custom permissions for this staff member (overrides role defaults)',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customPermissions?: string[];
} 