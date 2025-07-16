import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) {}

    /**
     * create new user
     * @param registerDto 
     * @returns user 
     */
    async create(registerDto: RegisterDto): Promise<User|undefined> {
        const user = this.userRepository.create(registerDto);
        console.log('user', user);
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            console.log("user create ", error);
        }
    }

    /**
     * create new user with basic data
     * @param userData 
     * @returns user 
     */
    async createWithBasicData(userData: {
        email: string;
        first_name: string;
        last_name: string;
        password: string;
    }): Promise<User|undefined> {
        const user = this.userRepository.create(userData);
        console.log('user with basic data', user);
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            console.log("user create with basic data ", error);
            
            // Check if it's a duplicate email error
            if (error.code === '23505' && error.constraint === 'UQ_97672ac88f789774dd47f7c8be3') {
                throw new BadRequestException('Email already exists. Please use a different email address or try logging in.');
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * create new user without password (for email validation flow)
     * @param createUserDto 
     * @returns user 
     */
    async createWithoutPassword(createUserDto: CreateUserDto): Promise<User|undefined> {
        // Generate a temporary password that will be replaced after email validation
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const userData = {
            ...createUserDto,
            password: tempPassword,
            is_verified: false, // User needs to verify email first
        };
        
        const user = this.userRepository.create(userData);
        console.log('user without password', user);
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            console.log("user create without password ", error);
        }
    }

    /**
     * Update user password after email validation
     * @param userId 
     * @param newPassword 
     * @returns user 
     */
    async updatePassword(userId: string, newPassword: string): Promise<User|undefined> {
        try {
            const user = await this.userRepository.findOne({ where: { user_id: userId } });
            if (!user) {
                throw new NotFoundException('User not found');
            }
            
            user.password = await bcrypt.hash(newPassword, 10);
            user.is_verified = true;
            
            return await this.userRepository.save(user);
        } catch (error) {
            console.log("update password ", error);
        }
    }

    /***
     * @param email
     * @returns user or raise NotFoundException 
     */
    async getUserByEmail(email: string) : Promise<User> {
        try {
            const user: User = await this.userRepository.findOneOrFail({
                where: {
                    email: email
                }
            });

            return user;
        } catch (error) {
            console.log('test', error)
            throw new NotFoundException('user not found');
        }
    }

    /**
     * Find user by ID
     * @param userId 
     * @returns user or null
     */
    async findById(userId: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { user_id: userId }
        });
    }

    /**
     * Update user's last login and activity
     * @param userId 
     * @param ipAddress 
     * @param userAgent 
     * @param location 
     * @param success 
     */
    async updateLoginActivity(
        userId: string, 
        ipAddress: string, 
        userAgent: string, 
        success: boolean, 
        location?: string
    ): Promise<void> {
        const user = await this.findById(userId);
        if (!user) return;

        user.recordLoginActivity(ipAddress, userAgent, success, location);
        await this.userRepository.save(user);
    }

    /**
     * Update user's last activity timestamp
     * @param userId 
     */
    async updateLastActivity(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            lastActivityAt: new Date()
        });
    }

    /**
     * Update 2FA setup
     * @param userId 
     * @param twoFAData 
     */
    async update2FASetup(userId: string, twoFAData: {
        twoFactorBackupCodes?: string;
    }): Promise<void> {
        try {
            console.log('Updating 2FA setup for user:', userId, 'data:', twoFAData);
            const result = await this.userRepository.update(userId, twoFAData);
            console.log('2FA setup update result:', result);
        } catch (error) {
            console.error('Error updating 2FA setup:', error);
            throw error;
        }
    }

    /**
     * Update Authenticator 2FA setup
     * @param userId 
     * @param twoFAData 
     */
    async updateAuthenticator2FA(userId: string, twoFAData: {
        twoFactorAuthenticatorSecret?: string;
        twoFactorBackupCodes?: string;
        twoFactorAuthenticatorEnabled: boolean;
    }): Promise<void> {
        try {
            console.log('Updating Authenticator 2FA setup for user:', userId, 'data:', twoFAData);
            const result = await this.userRepository.update(userId, twoFAData);
            console.log('Authenticator 2FA setup update result:', result);
        } catch (error) {
            console.error('Error updating Authenticator 2FA setup:', error);
            throw error;
        }
    }

    /**
     * Update Email 2FA setup
     * @param userId 
     * @param twoFAData 
     */
    async updateEmail2FA(userId: string, twoFAData: {
        twoFactorEmailSecret?: string;
        twoFactorEmailExpiresAt?: Date;
        twoFactorBackupCodes?: string;
        twoFactorEmailEnabled: boolean;
    }): Promise<void> {
        try {
            console.log('Updating Email 2FA setup for user:', userId, 'data:', twoFAData);
            const result = await this.userRepository.update(userId, twoFAData);
            console.log('Email 2FA setup update result:', result);
        } catch (error) {
            console.error('Error updating Email 2FA setup:', error);
            throw error;
        }
    }

    /**
     * Update Email 2FA for login (sending new code)
     * @param userId 
     * @param twoFAData 
     */
    async updateEmail2FALogin(userId: string, twoFAData: {
        twoFactorEmailSecret?: string;
        twoFactorEmailExpiresAt?: Date;
        twoFactorEmailAttempts: number;
    }): Promise<void> {
        try {
            console.log('Updating Email 2FA login for user:', userId, 'data:', twoFAData);
            const result = await this.userRepository.update(userId, twoFAData);
            console.log('Email 2FA login update result:', result);
        } catch (error) {
            console.error('Error updating Email 2FA login:', error);
            throw error;
        }
    }

    /**
     * Update Email 2FA attempts
     * @param userId 
     * @param attempts 
     */
    async updateEmail2FAAttempts(userId: string, attempts: number): Promise<void> {
        try {
            await this.userRepository.update(userId, {
                twoFactorEmailAttempts: attempts
            });
        } catch (error) {
            console.error('Error updating Email 2FA attempts:', error);
            throw error;
        }
    }

    /**
     * Lock Email 2FA
     * @param userId 
     * @param lockUntil 
     */
    async lockEmail2FA(userId: string, lockUntil: Date): Promise<void> {
        try {
            await this.userRepository.update(userId, {
                twoFactorEmailLockedUntil: lockUntil
            });
        } catch (error) {
            console.error('Error locking Email 2FA:', error);
            throw error;
        }
    }

    /**
     * Enable 2FA (deprecated - use specific enable methods)
     * @param userId 
     */
    async enable2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorVerifiedAt: new Date()
        });
    }

    /**
     * Enable Authenticator 2FA
     * @param userId 
     */
    async enableAuthenticator2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorAuthenticatorEnabled: true,
            twoFactorVerifiedAt: new Date()
        });
    }

    /**
     * Enable Email 2FA
     * @param userId 
     */
    async enableEmail2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorEmailEnabled: true,
            twoFactorVerifiedAt: new Date()
        });
    }

    /**
     * Disable 2FA (deprecated - use specific disable methods)
     * @param userId 
     */
    async disable2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorAuthenticatorSecret: undefined,
            twoFactorBackupCodes: undefined,
            twoFactorVerifiedAt: undefined
        });
    }

    /**
     * Disable Authenticator 2FA
     * @param userId 
     */
    async disableAuthenticator2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorAuthenticatorEnabled: false,
            twoFactorAuthenticatorSecret: undefined
        });
    }

    /**
     * Disable Email 2FA
     * @param userId 
     */
    async disableEmail2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorEmailEnabled: false,
            twoFactorEmailSecret: undefined,
            twoFactorEmailExpiresAt: undefined,
            twoFactorEmailAttempts: 0,
            twoFactorEmailLockedUntil: undefined
        });
    }

    /**
     * Disable all 2FA methods and clear backup codes
     * @param userId 
     */
    async disableAll2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorAuthenticatorEnabled: false,
            twoFactorAuthenticatorSecret: undefined,
            twoFactorEmailEnabled: false,
            twoFactorEmailSecret: undefined,
            twoFactorEmailExpiresAt: undefined,
            twoFactorEmailAttempts: 0,
            twoFactorEmailLockedUntil: undefined,
            twoFactorBackupCodes: undefined,
            twoFactorVerifiedAt: undefined
        });
    }

    /**
     * Update backup codes
     * @param userId 
     * @param backupCodes 
     */
    async updateBackupCodes(userId: string, backupCodes: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorBackupCodes: backupCodes
        });
    }

    /**
     * Get backup codes
     * @param userId 
     * @returns backup codes array or null
     */
    async getBackupCodes(userId: string): Promise<string[] | null> {
        const user = await this.findById(userId);
        if (!user || !user.twoFactorBackupCodes) {
            return null;
        }
        
        try {
            return JSON.parse(user.twoFactorBackupCodes);
        } catch (error) {
            console.error('Failed to parse backup codes:', error);
            return null;
        }
    }

    /**
     * Update pre-auth token
     * @param userId 
     * @param token 
     * @param expiresAt 
     */
    async updatePreAuthToken(userId: string, token: string, expiresAt: Date): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorPreAuthToken: token,
            twoFactorPreAuthExpiresAt: expiresAt
        });
    }

    /**
     * Find user by pre-auth token
     * @param token 
     * @returns user or null
     */
    async findByPreAuthToken(token: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { 
                twoFactorPreAuthToken: token,
                twoFactorPreAuthExpiresAt: MoreThan(new Date())
            }
        });
        return user;
    }

    /**
     * Clear pre-auth token
     * @param userId 
     */
    async clearPreAuthToken(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorPreAuthToken: undefined,
            twoFactorPreAuthExpiresAt: undefined
        });
    }

    /**
     * Check if account is locked
     * @param userId 
     * @returns boolean
     */
    async isAccountLocked(userId: string): Promise<boolean> {
        const user = await this.findById(userId);
        return user ? user.isAccountLocked() : false;
    }

    /**
     * Lock account
     * @param userId 
     * @param minutes 
     */
    async lockAccount(userId: string, minutes: number = 15): Promise<void> {
        const user = await this.findById(userId);
        if (user) {
            user.lockAccount(minutes);
            await this.userRepository.save(user);
        }
    }

    /**
     * Unlock account
     * @param userId 
     */
    async unlockAccount(userId: string): Promise<void> {
        const user = await this.findById(userId);
        if (user) {
            user.unlockAccount();
            await this.userRepository.save(user);
        }
    }

    /**
     * Update user preferences
     * @param userId 
     * @param preferences 
     */
    async updatePreferences(userId: string, preferences: any): Promise<void> {
        await this.userRepository.update(userId, { preferences });
    }

    /**
     * Get user login history
     * @param userId 
     * @returns login history array
     */
    async getLoginHistory(userId: string): Promise<any[]> {
        const user = await this.findById(userId);
        return user?.loginHistory || [];
    }

    /**
     * Clear login history
     * @param userId 
     */
    async clearLoginHistory(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            loginHistory: []
        });
    }

    /**
     * Update refresh token
     * @param userId 
     * @param refreshToken 
     */
    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
        await this.userRepository.update(userId, {
            hashed_refresh_token: refreshToken || undefined
        });
    }

    /**
     * Update password reset token
     * @param userId 
     * @param resetToken 
     * @param expiresAt 
     */
    async updatePasswordResetToken(userId: string, resetToken: string, expiresAt: Date): Promise<void> {
        await this.userRepository.update(userId, {
            passwordResetToken: resetToken,
            passwordResetExpiresAt: expiresAt
        });
    }

    /**
     * Find user by reset token
     * @param resetToken 
     * @returns user or null
     */
    async findByResetToken(resetToken: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { passwordResetToken: resetToken }
        });
    }

    /**
     * Clear password reset token
     * @param userId 
     */
    async clearPasswordResetToken(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            passwordResetToken: undefined,
            passwordResetExpiresAt: undefined
        });
    }

    /**
     * Verify user email
     * @param userId 
     */
    async verifyUser(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            is_verified: true
        });
    }
}
