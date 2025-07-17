import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'Unique identifier of the user' })
  user_id: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User\'s email address' })
  email: string;

  @ApiProperty({ example: 'John', description: 'User\'s first name' })
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'User\'s last name' })
  last_name: string;

  @ApiProperty({ example: true, description: 'Indicates if the user account is active' })
  is_active: boolean;

  @ApiProperty({ example: true, description: 'Indicates if the user account is verified' })
  is_verified: boolean;

  @ApiProperty({ example: true, description: 'Indicates if 2FA authenticator is enabled' })
  twoFactorAuthenticatorEnabled: boolean;

  @ApiProperty({ example: false, description: 'Indicates if 2FA email is enabled' })
  twoFactorEmailEnabled: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'User creation timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'User last update timestamp' })
  updated_at: Date;
} 