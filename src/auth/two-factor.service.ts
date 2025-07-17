import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User, TwoFactorMethod } from '../user/entities/user.entity';
import { UserService } from '../user/users.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
    constructor(
        private readonly userService: UserService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Setup 2FA for a user (either authenticator or email)
     */
    async setup2FA(userId: string, method: TwoFactorMethod): Promise<{
        secret?: string;
        qrCode?: string;
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
            
            if (method === TwoFactorMethod.AUTHENTICATOR) {
                // Check if authenticator 2FA is already enabled
                if (user.twoFactorAuthenticatorEnabled) {
                    throw new BadRequestException('Authenticator 2FA is already enabled');
                }

                console.log('Setting up authenticator 2FA');
                
                const secret = speakeasy.generateSecret({
                    name: `DentalFlow (${user.email})`,
                    issuer: 'DentalFlow',
                    length: 32
                });

                console.log('Generated secret for authenticator');

                const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
                console.log('Generated QR code');

                // Update user with secret only (no backup codes yet)
                await this.userService.updateAuthenticator2FA(userId, {
                    twoFactorAuthenticatorSecret: secret.base32,
                    twoFactorAuthenticatorEnabled: false // Will be enabled after verification
                });

                console.log('Updated user authenticator 2FA setup');

                return {
                    secret: secret.base32,
                    qrCode,
                    message: 'Scan the QR code with your authenticator app, then verify with a code'
                };
            } else if (method === TwoFactorMethod.EMAIL) {
                // Check if email 2FA is already enabled
                if (user.twoFactorEmailEnabled) {
                    throw new BadRequestException('Email 2FA is already enabled');
                }

                console.log('Setting up email 2FA');
                
                // For email 2FA, we'll send a code via email
                const tempCode = this.generateTempCode();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
                
                console.log('Generated temp code for email 2FA');
                
                await this.userService.updateEmail2FA(userId, {
                    twoFactorEmailSecret: tempCode,
                    twoFactorEmailExpiresAt: expiresAt,
                    twoFactorEmailEnabled: false
                });

                console.log('Updated user email 2FA setup');

                // Send email with verification code
                await this.mailService.send2FACode(user.email, tempCode);
                console.log('Sent 2FA code email');

                return {
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
    async verify2FASetup(userId: string, code: string, method: TwoFactorMethod): Promise<{ success: boolean; message: string; backupCodes?: string[] }> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        let isValid = false;

        if (method === TwoFactorMethod.AUTHENTICATOR) {
            if (user.twoFactorAuthenticatorEnabled) {
                throw new BadRequestException('Authenticator 2FA is already enabled');
            }

            isValid = speakeasy.totp.verify({
                secret: user.twoFactorAuthenticatorSecret!,
                encoding: 'base32',
                token: code,
                window: 2 // Allow 2 time steps in case of clock skew
            });

            if (isValid) {
                await this.userService.enableAuthenticator2FA(userId);
            }
        } else if (method === TwoFactorMethod.EMAIL) {
            if (user.twoFactorEmailEnabled) {
                throw new BadRequestException('Email 2FA is already enabled');
            }

            // Check if email code is expired
            if (!user.twoFactorEmailExpiresAt || new Date() > user.twoFactorEmailExpiresAt) {
                throw new BadRequestException('Email verification code has expired');
            }

            // For email, compare with stored temp code
            isValid = user.twoFactorEmailSecret === code;

            if (isValid) {
                await this.userService.enableEmail2FA(userId);
            }
        }

        if (isValid) {
            // Generate new backup codes after successful verification
            const newBackupCodes = this.generateBackupCodes();
            const hashedBackupCodes = this.hashBackupCodes(newBackupCodes);
            
            // Update user with new backup codes (this replaces any existing ones)
            await this.userService.updateBackupCodes(userId, JSON.stringify(hashedBackupCodes));
            
            return {
                success: true,
                message: '2FA has been enabled successfully',
                backupCodes: newBackupCodes
            };
        } else {
            throw new BadRequestException('Invalid verification code');
        }
    }

    /**
     * Send a new 2FA code via email (for login)
     */
    async send2FAEmailCode(user: User): Promise<void> {
        if (!user.twoFactorEmailEnabled) {
            throw new BadRequestException('Email 2FA is not enabled');
        }

        // Check if email 2FA is locked
        if (user.twoFactorEmailLockedUntil && new Date() < user.twoFactorEmailLockedUntil) {
            throw new BadRequestException('Email 2FA is temporarily locked due to too many failed attempts');
        }

        // Generate a new code
        const tempCode = this.generateTempCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user secret
        await this.userService.updateEmail2FALogin(user.user_id, {
            twoFactorEmailSecret: tempCode,
            twoFactorEmailExpiresAt: expiresAt,
            twoFactorEmailAttempts: 0 // Reset attempts
        });

        // Send email
        await this.mailService.send2FACode(user.email, tempCode);
    }

    /**
     * Verify 2FA code during login (accepts either authenticator or email code if both enabled)
     */
    async verify2FACode(user: User, code: string): Promise<boolean> {
        if (!user.twoFactorAuthenticatorEnabled && !user.twoFactorEmailEnabled) {
            return true; // No 2FA required
        }

        let valid = false;

        // Try authenticator first
        if (user.twoFactorAuthenticatorEnabled && user.twoFactorAuthenticatorSecret) {
            valid = speakeasy.totp.verify({
                secret: user.twoFactorAuthenticatorSecret,
                encoding: 'base32',
                token: code,
                window: 2
            });
        }

        // If authenticator didn't work, try email
        if (!valid && user.twoFactorEmailEnabled) {
            // Check if email 2FA is locked
            if (user.twoFactorEmailLockedUntil && new Date() < user.twoFactorEmailLockedUntil) {
                throw new BadRequestException('Email 2FA is temporarily locked due to too many failed attempts');
            }

            // Check if email code is expired
            if (!user.twoFactorEmailExpiresAt || new Date() > user.twoFactorEmailExpiresAt) {
                throw new BadRequestException('Email verification code has expired');
            }

            valid = user.twoFactorEmailSecret === code;

            if (!valid) {
                // Increment failed attempts
                const newAttempts = (user.twoFactorEmailAttempts || 0) + 1;
                await this.userService.updateEmail2FAAttempts(user.user_id, newAttempts);

                // Lock after 5 failed attempts for 15 minutes
                if (newAttempts >= 5) {
                    const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                    await this.userService.lockEmail2FA(user.user_id, lockUntil);
                    throw new BadRequestException('Too many failed attempts. Email 2FA is now locked for 15 minutes.');
                }
            } else {
                // Reset attempts on successful verification
                await this.userService.updateEmail2FAAttempts(user.user_id, 0);
            }
        }

        return valid;
    }

    /**
     * Verify backup code
     */
    async verifyBackupCode(user: User, code: string): Promise<boolean> {
        if (!user.twoFactorBackupCodes) {
            return false;
        }

        try {
            const hashedBackupCodes = JSON.parse(user.twoFactorBackupCodes);
            const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
            const index = hashedBackupCodes.indexOf(hashedInput);
            
            if (index !== -1) {
                // Remove used backup code
                hashedBackupCodes.splice(index, 1);
                await this.userService.updateBackupCodes(user.user_id, JSON.stringify(hashedBackupCodes));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error verifying backup code:', error);
            return false;
        }
    }

    /**
     * Disable specific 2FA method
     */
    async disable2FA(userId: string, password: string, method: TwoFactorMethod): Promise<{ success: boolean; message: string }> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify password
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        if (method === TwoFactorMethod.AUTHENTICATOR) {
            if (!user.twoFactorAuthenticatorEnabled) {
                throw new BadRequestException('Authenticator 2FA is not enabled');
            }
            await this.userService.disableAuthenticator2FA(userId);
        } else if (method === TwoFactorMethod.EMAIL) {
            if (!user.twoFactorEmailEnabled) {
                throw new BadRequestException('Email 2FA is not enabled');
            }
            await this.userService.disableEmail2FA(userId);
        }

        return {
            success: true,
            message: `${method} 2FA has been disabled successfully`
        };
    }

    /**
     * Use backup code to disable all 2FA methods (DEPRECATED - use complete2FAWithBackupCode instead)
     */
    async useBackupCode(userId: string, backupCode: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify backup code
        const isValidBackupCode = await this.verifyBackupCode(user, backupCode);
        if (!isValidBackupCode) {
            throw new BadRequestException('Invalid backup code');
        }

        // Disable all 2FA methods and clear backup codes
        await this.userService.disableAll2FA(userId);

        return {
            success: true,
            message: 'All 2FA methods have been disabled using backup code'
        };
    }

    /**
     * Generate backup codes in format: XXXX-XXXX-XXXX-XXXX
     */
    private generateBackupCodes(): string[] {
        const codes: string[] = [];
        for (let i = 0; i < 10; i++) {
            const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part4 = Math.random().toString(36).substring(2, 6).toUpperCase();
            codes.push(`${part1}-${part2}-${part3}-${part4}`);
        }
        return codes;
    }

    /**
     * Hash backup codes for storage
     */
    private hashBackupCodes(codes: string[]): string[] {
        return codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
    }

    /**
     * Generate temporary code for email 2FA
     */
    private generateTempCode(): string {
        return Math.random().toString().substring(2, 8);
    }
} 