import { ApiProperty } from '@nestjs/swagger';

export class PreAuthResponseDto {
  @ApiProperty({ description: 'Temporary 2FA token for second factor authentication' })
  twoFactorToken: string;

  @ApiProperty({ description: 'User email for 2FA verification' })
  email: string;

  @ApiProperty({ description: 'Available 2FA methods for this user' })
  twoFactorMethods: {
    authenticator: boolean;
    email: boolean;
  };

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;
} 