import { IsString, MaxLength } from 'class-validator';

export class CancelPatientDto {
  @IsString()
  @MaxLength(200)
  reason: string;
} 