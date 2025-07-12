import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User, TwoFactorMethod } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { CreateUserDto } from './dtos/create-user.dto';

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
            
            user.password = newPassword;
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
            console.log('', error)
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
        twoFactorMethod: TwoFactorMethod;
        twoFactorSecret?: string;
        twoFactorBackupCodes?: string;
        twoFactorEnabled: boolean;
    }): Promise<void> {
        await this.userRepository.update(userId, twoFAData);
    }

    /**
     * Enable 2FA
     * @param userId 
     */
    async enable2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorEnabled: true,
            twoFactorVerifiedAt: new Date()
        });
    }

    /**
     * Disable 2FA
     * @param userId 
     */
    async disable2FA(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            twoFactorEnabled: false,
            twoFactorMethod: TwoFactorMethod.NONE,
            twoFactorSecret: undefined,
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
}
