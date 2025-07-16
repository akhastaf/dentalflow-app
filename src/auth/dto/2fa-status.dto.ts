import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorStatusDto {
    @ApiProperty({ 
        example: true, 
        description: 'Whether authenticator 2FA is enabled' 
    })
    twoFactorAuthenticatorEnabled: boolean;

    @ApiProperty({ 
        example: false, 
        description: 'Whether email 2FA is enabled' 
    })
    twoFactorEmailEnabled: boolean;

    @ApiProperty({ 
        example: ['ABC123', 'DEF456', 'GHI789'], 
        description: 'Backup codes (only shown during setup)' 
    })
    backupCodes?: string[];
} 