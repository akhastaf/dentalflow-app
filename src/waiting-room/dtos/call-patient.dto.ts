import { IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CallPatientDto {
  @ApiPropertyOptional({
    example: 'a1b2c34-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    description: 'ID ofthe doctor calling the patient'
  })
  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;
  
  @ApiPropertyOptional({
    example: 'Patient called to consultation room 2',
    description: 'Additional notes about the call',    maxLength: 200
  })

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
} 