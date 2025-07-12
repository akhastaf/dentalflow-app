import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsPhoneNumber, IsArray, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { Gender } from '../entities/patient.entity';

export class AllergyDto {
  @ApiProperty({ example: 'Penicillin', description: 'Name of the allergy' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Severe reaction', description: 'Description of the allergy reaction' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'High', description: 'Severity level of the allergy' })
  @IsString()
  @IsOptional()
  severity?: string;
}

export class MedicalHistoryDto {
  @ApiProperty({ example: 'Diabetes', description: 'Medical condition name' })
  @IsString()
  condition: string;

  @ApiPropertyOptional({ example: 'Type 2 diabetes diagnosed in 2020', description: 'Description of the condition' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2020-01-01', description: 'Date when condition was diagnosed' })
  @IsDateString()
  @IsOptional()
  diagnosedDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the condition is currently active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: ['Metformin', 'Insulin'], description: 'Current medications for this condition' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];
}

export class DentalHistoryDto {
  @ApiProperty({ example: 'Filling', description: 'Type of dental procedure' })
  @IsString()
  procedure: string;

  @ApiPropertyOptional({ example: 'Tooth 14', description: 'Specific tooth or area treated' })
  @IsString()
  @IsOptional()
  tooth?: string;

  @ApiPropertyOptional({ example: '2023-06-15', description: 'Date when procedure was performed' })
  @IsDateString()
  @IsOptional()
  performedDate?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith', description: 'Dentist who performed the procedure' })
  @IsString()
  @IsOptional()
  performedBy?: string;

  @ApiPropertyOptional({ example: 'Good condition, no issues', description: 'Notes about the procedure' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePatientDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: 'Spouse' })
  @IsString()
  @IsOptional()
  emergencyContactRelationship?: string;

  @ApiPropertyOptional({ example: '+1234567891' })
  @IsPhoneNumber()
  @IsOptional()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsString()
  @IsOptional()
  emergencyContactAddress?: string;

  @ApiPropertyOptional({ example: 'Blue Cross Blue Shield' })
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: 'BCBS123456' })
  @IsString()
  @IsOptional()
  insuranceNumber?: string;

  @ApiPropertyOptional({ example: 'Patient prefers morning appointments' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ 
    type: [AllergyDto],
    description: 'List of patient allergies',
    example: [
      { name: 'Penicillin', description: 'Severe reaction', severity: 'High' },
      { name: 'Latex', description: 'Mild skin irritation', severity: 'Low' }
    ]
  })
  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  allergies?: AllergyDto[];

  @ApiPropertyOptional({ 
    type: [MedicalHistoryDto],
    description: 'Medical conditions and history',
    example: [
      { 
        condition: 'Diabetes', 
        description: 'Type 2 diabetes', 
        diagnosedDate: '2020-01-01',
        isActive: true,
        medications: ['Metformin']
      }
    ]
  })
  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  medicalHistories?: MedicalHistoryDto[];

  @ApiPropertyOptional({ 
    type: [DentalHistoryDto],
    description: 'Previous dental procedures',
    example: [
      { 
        procedure: 'Filling', 
        tooth: 'Tooth 14', 
        performedDate: '2023-06-15',
        performedBy: 'Dr. Smith',
        notes: 'Good condition'
      }
    ]
  })
  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  previousDentalHistory?: DentalHistoryDto[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPregnant?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  pregnancyMonth?: number;
} 