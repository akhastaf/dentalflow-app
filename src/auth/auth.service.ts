import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { User, TwoFactorMethod } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/types/jwt-payload';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/users.service';
import { TwoFactorService } from './two-factor.service';
import { TenantService } from 'src/tenant/tenant.service';
import { StaffService } from 'src/staff/staff.service';
import { StaffRole, SalaryType } from 'src/staff/entities/staff.entity';
import { Request } from 'express';
import { EntityNotFoundError } from 'typeorm';
import * as crypto from 'crypto';

export interface LoginResponse {
    accessToken: string | null;
    user: User | null;
    requires2FA?: boolean;
    twoFactorMethods?: {
        authenticator: boolean;
        email: boolean;
    };
    preAuthToken?: string;
}

export interface PreAuthResponse {
    twoFactorToken: string;
    email: string;
    twoFactorMethods: {
        authenticator: boolean;
        email: boolean;
    };
    expiresIn: number;
}

@Injectable()
export class AuthService {

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly userService: UserService,
        private readonly twoFactorService: TwoFactorService,
        private readonly tenantService: TenantService,
        private readonly staffService: StaffService
    ) {}

    async register(registerDto: RegisterDto) : Promise<{ user: User; tenant: any; staff: any }> {
        console.log('Starting registration process for:', registerDto.email);
        
        // Create user first
        const userData = {
            email: registerDto.email,
            first_name: registerDto.first_name,
            last_name: registerDto.last_name,
            password: registerDto.password,
        };
        
        console.log('Creating user with data:', userData);
        let newUser: User|undefined;
        try {
            newUser = await this.userService.createWithBasicData(userData);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error; // Re-throw the specific email error
            }
            throw new BadRequestException('Failed to create user account');
        }
        
        if (!newUser) {
            throw new BadRequestException('Failed to create user account');
        }
        console.log('User created successfully:', newUser.user_id);

        // Create tenant
        const tenantData = {
            name: registerDto.tenantName,
            slug: registerDto.tenantSlug,
            phone: registerDto.tenantPhone,
            email: registerDto.email, // Use user's email as tenant email
            address: registerDto.tenantAddress,
            city: registerDto.tenantCity,
    
            ownerUserId: newUser.user_id,
        };

        console.log('Creating tenant with data:', tenantData);
        const tenant = await this.tenantService.create(tenantData);
        console.log('Tenant created successfully:', tenant.id);

        // Create staff entry for the user as admin
        const staffData = {
            userId: newUser.user_id,
            role: StaffRole.ADMIN,
            isOwner: true,
            workingDays: [1, 2, 3, 4, 5], // Monday to Friday
            salaryType: SalaryType.FIXED,
            salaryAmount: 0, // Admin doesn't need salary tracking
            customPermissions: [],
        };

        console.log('Creating staff with data:', staffData);
        const staff = await this.staffService.create(staffData, tenant.id);
        console.log('Staff created successfully:', staff.id);

        // Send confirmation email
        this.mailService.sendUserConfirmation(newUser);

        console.log('Registration completed successfully');
        return { user: newUser, tenant, staff };
    }

    async login(loginDto: LoginDto, request?: Request): Promise<LoginResponse> {
        try {
            const user: User = await this.userService.getUserByEmail(loginDto.email);

            console.log('user ', user);
            
            // Check if account is locked
            if (user.isAccountLocked()) {
                throw new BadRequestException('Account is temporarily locked due to too many failed attempts');
            }

            // Verify password
            const isPasswordValid = await user.verifyPassword(loginDto.password);
            console.log('password is valid ', isPasswordValid);
            if (!isPasswordValid) {
                // Record failed login attempt
                await this.recordFailedLogin(user, request);
                throw new BadRequestException('Invalid email or password');
            }

            // Check if user is verified
            if (!user.is_verified) {
                throw new BadRequestException('Please verify your email first');
            }

            // Check if user is active
            if (!user.is_active) {
                throw new BadRequestException('Account is deactivated');
            }

            // Record successful login
            await this.recordSuccessfulLogin(user, request);

            // Check if 2FA is required
            if (user.twoFactorAuthenticatorEnabled || user.twoFactorEmailEnabled) {
                // Generate pre-auth token for 2FA
                const preAuthToken = await this.generatePreAuthToken(user);
                
                return {
                    accessToken: null,
                    user: null,
                    requires2FA: true,
                    twoFactorMethods: {
                        authenticator: user.twoFactorAuthenticatorEnabled,
                        email: user.twoFactorEmailEnabled,
                    },
                    preAuthToken,
                };
            }

            // Generate JWT token
            const payload: JwtPayload = {
                email: user.email,
                sub: user.user_id
            };
            
            const jwtSignOptions: JwtSignOptions = {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION'),
            };
            
            const accessToken = this.jwtService.sign(payload, jwtSignOptions);

            return {
                accessToken,
                user
            };

        } catch (e) {
            if (e instanceof BadRequestException) {
                throw e;
            } else if (e instanceof UnauthorizedException) {
                throw e;
            } else if (e instanceof NotFoundException) {
                // Handle TypeORM EntityNotFoundError specifically
                throw new BadRequestException('Invalid email or password');
            } else {
                console.error('Login error:', e);
                throw new InternalServerErrorException('Something went wrong');
            }
        }
    }

    /**
     * Complete login with 2FA code (legacy method - uses email)
     */
    async completeLoginWith2FA(email: string, twoFactorCode: string, request?: Request): Promise<LoginResponse> {
        try {
            console.log('2FA completion attempt for email:', email);
            
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                throw new BadRequestException('User not found');
            }
            
            return await this.complete2FAForUser(user, twoFactorCode, request);
        } catch (error) {
            console.error('2FA completion error:', error);
            throw error;
        }
    }

    /**
     * Complete 2FA for a user (new method - uses user object)
     */
    async complete2FAForUser(user: User, twoFactorCode: string, request?: Request): Promise<LoginResponse> {
        try {
            if (!user.twoFactorAuthenticatorEnabled && !user.twoFactorEmailEnabled) {
                throw new BadRequestException('2FA is not enabled for this account');
            }

            console.log('User found, 2FA enabled:', user.twoFactorAuthenticatorEnabled || user.twoFactorEmailEnabled);

            // Verify 2FA code
            const is2FAValid = await this.twoFactorService.verify2FACode(user, twoFactorCode);
            if (!is2FAValid) {
                // Check if it's a backup code
                const isBackupValid = await this.twoFactorService.verifyBackupCode(user, twoFactorCode);
                if (!isBackupValid) {
                    throw new BadRequestException('Invalid 2FA code');
                }
            }

            console.log('2FA code verified successfully');

            // Generate JWT token
            const payload: JwtPayload = {
                email: user.email,
                sub: user.user_id
            };
            
            const jwtSignOptions: JwtSignOptions = {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION'),
            };
            
            const accessToken = this.jwtService.sign(payload, jwtSignOptions);

            // Record successful login
            await this.recordSuccessfulLogin(user, request);

            return {
                accessToken,
                user
            };
        } catch (error) {
            console.error('2FA completion error in service:', error);
            throw error;
        }
    }

    /**
     * Setup 2FA for a user
     */
    async setup2FA(userId: string, method: TwoFactorMethod) {
        return await this.twoFactorService.setup2FA(userId, method);
    }

    /**
     * Verify 2FA setup
     */
    async verify2FASetup(userId: string, code: string, method: TwoFactorMethod) {
        return await this.twoFactorService.verify2FASetup(userId, code, method);
    }

    /**
     * Disable 2FA
     */
    async disable2FA(userId: string, password: string, method: TwoFactorMethod) {
        return await this.twoFactorService.disable2FA(userId, password, method);
    }

    /**
     * Refresh token
     */
    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET')
            });

            const user = await this.userService.findById(payload.sub);
            if (!user || !user.is_active) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new access token
            const newPayload: JwtPayload = {
                email: user.email,
                sub: user.user_id
            };
            
            const jwtSignOptions: JwtSignOptions = {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION'),
            };
            
            const accessToken = this.jwtService.sign(newPayload, jwtSignOptions);

            return {
                accessToken,
                user
            };

        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Logout user
     */
    async logout(userId: string): Promise<void> {
        // Clear refresh token
        await this.userService.updateRefreshToken(userId, null);
    }

    /**
     * Record failed login attempt
     */
    private async recordFailedLogin(user: User, request?: Request): Promise<void> {
        const ipAddress = this.getClientIp(request);
        const userAgent = this.getUserAgent(request);
        const location = this.getClientLocation(request);

        await this.userService.updateLoginActivity(user.user_id, ipAddress, userAgent, false, location);

        // Lock account if too many failed attempts
        if (user.failedLoginAttempts >= 4) { // 5th attempt
            await this.userService.lockAccount(user.user_id, 15); // Lock for 15 minutes
        }
    }

    /**
     * Record successful login
     */
    private async recordSuccessfulLogin(user: User, request?: Request): Promise<void> {
        const ipAddress = this.getClientIp(request);
        const userAgent = this.getUserAgent(request);
        const location = this.getClientLocation(request);

        await this.userService.updateLoginActivity(user.user_id, ipAddress, userAgent, true, location);
    }

    /**
     * Get client IP address
     */
    private getClientIp(request?: Request): string {
        if (!request) return 'unknown';
        
        return request.ip || 
               request.connection?.remoteAddress || 
               request.socket?.remoteAddress || 
               'unknown';
    }

    /**
     * Get user agent
     */
    private getUserAgent(request?: Request): string {
        if (!request) return 'unknown';
        
        return request.headers['user-agent'] || 'unknown';
    }

    /**
     * Get client location from headers (if available)
     */
    private getClientLocation(request?: Request): string | undefined {
        if (!request) return undefined;
        
        // Try to get location from various headers
        return request.headers['x-forwarded-for']?.toString().split(',')[0] || 
               request.headers['cf-connecting-ip']?.toString() ||
               request.headers['x-real-ip']?.toString() ||
               undefined;
    }

    /**
     * Forgot password - send reset email
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        try {
            const user = await this.userService.getUserByEmail(forgotPasswordDto.email);
            
            if (!user.is_verified) {
                throw new BadRequestException('Please verify your email first');
            }

            if (!user.is_active) {
                throw new BadRequestException('Account is deactivated');
            }



            // Send reset email using database token
            await this.mailService.sendPasswordReset(user);

            return { message: 'Password reset email sent successfully' };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            // Don't reveal if user exists or not for security
            return { message: 'If an account with this email exists, a password reset link has been sent' };
        }
    }

    /**
     * Find user by email
     */
    async findUserByEmail(email: string): Promise<User | null> {
        try {
            return await this.userService.getUserByEmail(email);
        } catch (error) {
            return null;
        }
    }

    /**
     * Update user password
     */
    async updatePassword(userId: string, newPassword: string): Promise<void> {
        await this.userService.updatePassword(userId, newPassword);
    }

    /**
     * Reset password with token
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        try {
            // Find user by reset token
            const user = await this.userService.findByResetToken(resetPasswordDto.token);
            
            if (!user) {
                throw new BadRequestException('Invalid or expired reset token');
            }

            // Check if token is expired
            if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
                throw new BadRequestException('Reset token has expired');
            }

            // Update password and clear reset token
            await this.userService.updatePassword(user.user_id, resetPasswordDto.password);
            await this.userService.clearPasswordResetToken(user.user_id);

            return { message: 'Password reset successfully' };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to reset password');
        }
    }

    /**
     * Resend verification email
     */
    async resendVerification(email: string): Promise<{ message: string }> {
        try {
            const user = await this.findUserByEmail(email);
            if (!user) {
                throw new BadRequestException('User not found');
            }

            if (user.is_verified) {
                throw new BadRequestException('User is already verified');
            }

            // Send confirmation email
            this.mailService.sendUserConfirmation(user);
            
            return { message: 'Verification email sent successfully' };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to resend verification email');
        }
    }

    /**
     * Verify email with JWT token
     */
    async verifyEmail(token: string): Promise<{ message: string }> {
        try {
            console.log('Verifying email with token:', token);
            
            // Get the JWT secret for email verification
            const jwtSecret = this.configService.get('JWT_EMAIL_VERIFICATION_SECRET');
            if (!jwtSecret) {
                console.error('JWT_EMAIL_VERIFICATION_SECRET is not configured');
                throw new InternalServerErrorException('Email verification is not properly configured');
            }
            
            console.log('Using JWT secret for verification');
            
            // Verify the JWT token
            const payload = this.jwtService.verify(token, {
                secret: jwtSecret
            });
            
            console.log('JWT payload:', payload);

            // Find user by email from token
            const user = await this.findUserByEmail(payload.email);
            if (!user) {
                console.log('User not found for email:', payload.email);
                throw new BadRequestException('User not found');
            }

            // Check if user is already verified
            if (user.is_verified) {
                console.log('User is already verified:', user.email);
                throw new BadRequestException('User is already verified');
            }

            // Mark user as verified
            await this.userService.verifyUser(user.user_id);
            console.log('User verified successfully:', user.email);
            
            return { message: 'Email verified successfully' };
        } catch (error) {
            console.error('Email verification error:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            if (error.name === 'TokenExpiredError') {
                throw new BadRequestException('Verification token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new BadRequestException('Invalid verification token');
            }
            throw new InternalServerErrorException('Failed to verify email');
        }
    }

    async send2FAEmailCode(user: User): Promise<void> {
        await this.twoFactorService.send2FAEmailCode(user);
    }

    /**
     * Generate pre-auth token for 2FA flow
     */
    private async generatePreAuthToken(user: User): Promise<string> {
        const payload = {
            sub: user.user_id,
            email: user.email,
            type: '2fa_preauth'
        };
        
        const jwtSignOptions: JwtSignOptions = {
            secret: this.configService.get('JWT_2FA_SECRET'),
            expiresIn: '10m', // 10 minutes
        };
        
        return this.jwtService.sign(payload, jwtSignOptions);
    }

    /**
     * Verify pre-auth token
     */
    async verifyPreAuthToken(token: string): Promise<User | null> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_2FA_SECRET'),
            });
            
            if (payload.type !== '2fa_preauth') {
                return null;
            }
            
            return await this.userService.findById(payload.sub);
        } catch (error) {
            return null;
        }
    }

    /**
     * Complete 2FA with backup code
     */
    async complete2FAWithBackupCode(token: string, backupCode: string, request?: Request): Promise<LoginResponse> {
        const user = await this.verifyPreAuthToken(token);
        if (!user) {
            throw new UnauthorizedException('Invalid or expired 2FA token');
        }

        // Verify backup code
        const isValidBackupCode = await this.twoFactorService.verifyBackupCode(user, backupCode);
        if (!isValidBackupCode) {
            throw new BadRequestException('Invalid backup code');
        }

        // Record successful login
        await this.recordSuccessfulLogin(user, request);

        // Generate final access token
        const payload: JwtPayload = {
            email: user.email,
            sub: user.user_id
        };
        
        const jwtSignOptions: JwtSignOptions = {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRATION'),
        };
        
        const accessToken = this.jwtService.sign(payload, jwtSignOptions);

        // JWT tokens are stateless, no need to clear from database

        // Send security notification
        await this.mailService.sendBackupCodeUsedNotification(user);

        return {
            accessToken,
            user
        };
    }
}
