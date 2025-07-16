import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Complete2FADto {
  @ApiProperty({
    description: '2FA verification code',
    example: '123456'
  })
  @IsString({ message: 'twoFactorCode must be a string' })
  @IsNotEmpty({ message: 'twoFactorCode is required' })
  @Length(6, 6, { message: 'twoFactorCode must be exactly 6 characters long' })
  twoFactorCode: string;
} 