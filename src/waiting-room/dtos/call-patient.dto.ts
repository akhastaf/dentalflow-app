import { IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';

export class CallPatientDto {
  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
} 