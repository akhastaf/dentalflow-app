import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User, TwoFactorMethod } from '../user/entities/user.entity';
import { UserService } from '../user/users.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
    constructor(
        private readonly userService: UserService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Setup 2FA for a user
     */
    async setup2FA(userId: string, method: TwoFactorMethod): Promise<{
        secret?: string;
        qrCode?: string;
        backupCodes: string[];
        message: string;
    }> {
        try {
            console.log('Setting up 2FA for user:', userId, 'method:', method);
            
            const user = await this.userService.findById(userId);
            if (!user) {
                console.error('User not found:', userId);
                throw new BadRequestException('User not found');
            }

            console.log('Found user:', user.email);

            if (user.twoFactorEnabled) {
                console.log('2FA already enabled for user:', user.email);
                throw new BadRequestException('2FA is already enabled');
            }

            const backupCodes = this.generateBackupCodes();
            console.log('Generated backup codes');
            
            if (method === TwoFactorMethod.AUTHENTICATOR) {
                console.log('Setting up authenticator 2FA');
                
                const secret = speakeasy.generateSecret({
                    name: `DentalFlow (${user.email})`,
                    issuer: 'DentalFlow',
                    length: 32
                });

                console.log('Generated secret for authenticator');

                const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
                console.log('Generated QR code');

                // Update user with secret and backup codes
                await this.userService.update2FASetup(userId, {
                    twoFactorMethod: method,
                    twoFactorSecret: secret.base32,
                    twoFactorBackupCodes: JSON.stringify(backupCodes),
                    twoFactorEnabled: false // Will be enabled after verification
                });

                console.log('Updated user 2FA setup');

                return {
                    secret: secret.base32,
                    qrCode,
                    backupCodes,
                    message: 'Scan the QR code with your authenticator app, then verify with a code'
                };
            } else if (method === TwoFactorMethod.EMAIL) {
                console.log('Setting up email 2FA');
                
                // For email 2FA, we'll send a code via email
                const tempCode = this.generateTempCode();
                console.log('Generated temp code for email 2FA');
                
                await this.userService.update2FASetup(userId, {
                    twoFactorMethod: method,
                    twoFactorSecret: tempCode, // Store temp code as secret
                    twoFactorBackupCodes: JSON.stringify(backupCodes),
                    twoFactorEnabled: false
                });

                console.log('Updated user 2FA setup for email');

                // Send email with verification code
                await this.mailService.send2FACode(user.email, tempCode);
                console.log('Sent 2FA code email');

                return {
                    backupCodes,
                    message: 'Verification code sent to your email'
                };
            }

            console.error('Invalid 2FA method:', method);
            throw new BadRequestException('Invalid 2FA method');
        } catch (error) {
            console.error('Error in setup2FA:', error);
            throw error;
        }
    }

    /**
     * Verify 2FA setup
     */
    async verify2FASetup(userId: string, code: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.twoFactorEnabled) {
            throw new BadRequestException('2FA is already enabled');
        }

        let isValid = false;

        if (user.twoFactorMethod === TwoFactorMethod.AUTHENTICATOR) {
            isValid = speakeasy.totp.verify({
                secret: user.twoFactorSecret!,
                encoding: 'base32',
                token: code,
                window: 2 // Allow 2 time steps in case of clock skew
            });
        } else if (user.twoFactorMethod === TwoFactorMethod.EMAIL) {
            // For email, compare with stored temp code
            isValid = user.twoFactorSecret === code;
        }

        if (isValid) {
            await this.userService.enable2FA(userId);
            return {
                success: true,
                message: '2FA has been enabled successfully'
            };
        } else {
            throw new BadRequestException('Invalid verification code');
        }
    }

    /**
     * Verify 2FA code during login
     */
    async verify2FACode(user: User, code: string): Promise<boolean> {
        if (!user.twoFactorEnabled || user.twoFactorMethod === TwoFactorMethod.NONE) {
            return true; // No 2FA required
        }

        if (user.twoFactorMethod === TwoFactorMethod.AUTHENTICATOR) {
            return speakeasy.totp.verify({
                secret: user.twoFactorSecret!,
                encoding: 'base32',
                token: code,
                window: 2
            });
        } else if (user.twoFactorMethod === TwoFactorMethod.EMAIL) {
            // For email 2FA, you might want to implement a temporary code system
            // For now, we'll use the same approach as setup verification
            return user.twoFactorSecret === code;
        }

        return false;
    }

    /**
     * Verify backup code
     */
    async verifyBackupCode(user: User, code: string): Promise<boolean> {
        if (!user.twoFactorBackupCodes) {
            return false;
        }

        const backupCodes = JSON.parse(user.twoFactorBackupCodes);
        const index = backupCodes.indexOf(code);
        
        if (index !== -1) {
            // Remove used backup code
            backupCodes.splice(index, 1);
            await this.userService.updateBackupCodes(user.user_id, JSON.stringify(backupCodes));
            return true;
        }

        return false;
    }

    /**
     * Disable 2FA
     */
    async disable2FA(userId: string, code: string, password: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (!user.twoFactorEnabled) {
            throw new BadRequestException('2FA is not enabled');
        }

        // Verify password first
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        // Verify 2FA code
        const isCodeValid = await this.verify2FACode(user, code);
        if (!isCodeValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        // Disable 2FA
        await this.userService.disable2FA(userId);

        return {
            success: true,
            message: '2FA has been disabled successfully'
        };
    }

    /**
     * Generate backup codes
     */
    private generateBackupCodes(): string[] {
        const codes: string[] = [];
        for (let i = 0; i < 10; i++) {
            codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
        }
        return codes;
    }

    /**
     * Generate temporary code for email 2FA
     */
    private generateTempCode(): string {
        return Math.random().toString().substring(2, 8);
    }
} 