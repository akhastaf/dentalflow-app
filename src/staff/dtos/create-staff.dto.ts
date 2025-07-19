import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { StaffRole, SalaryType } from '../entities/staff.entity';

export class CreateStaffDto {
  @ApiProperty({ description: 'User ID to assign to staff' })
  @IsUUID()
  userId: string;

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
    description: 'Salary amount in MAD (Moroccan Dirham) - fixed amount or percentage base',
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'salaryAmount must be a number' })
  @Min(0, { message: 'salaryAmount must not be less than 0' })
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
