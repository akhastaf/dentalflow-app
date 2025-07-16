import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyBackupCodeDto {
  @ApiProperty({
    description: 'The backup code to verify',
    example: 'ABCD-EFGH-IJKL-MNOP',
    minLength: 19,
    maxLength: 19
  })
  @IsString()
  @IsNotEmpty()
  @Length(19, 19, { message: 'Backup code must be exactly 19 characters' })
  backupCode: string;
} 