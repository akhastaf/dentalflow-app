import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailToken, EmailTokenType } from '../database/entities/email-token.entity';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service for managing email tokens used in password resets and email confirmations
 */
@Injectable()
export class EmailTokenService {
    private readonly logger = new Logger(EmailTokenService.name);

    constructor(
        @InjectRepository(EmailToken)
        private emailTokenRepository: Repository<EmailToken>,
        private configService: ConfigService
    ) {}

    /**
     * Generate a secure random token
     * @returns A 32-character hexadecimal token
     * @private
     */
    private generateToken(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Create a new email token for password reset
     * @param user - The user requesting the password reset
     * @returns The created email token
     */
    async createPasswordResetToken(user: User): Promise<EmailToken> {
        // Invalidate any existing password reset tokens for this user
        await this.emailTokenRepository.update(
            { 
                userId: user.user_id, 
                type: EmailTokenType.PASSWORD_RESET,
                used: false 
            },
            { used: true }
        );

        // Create new token
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

        const emailToken = this.emailTokenRepository.create({
            token,
            type: EmailTokenType.PASSWORD_RESET,
            userId: user.user_id,
            expiresAt,
            used: false
        });

        const savedToken = await this.emailTokenRepository.save(emailToken);
        this.logger.log(`Created password reset token for user ${user.email}`);
        
        return savedToken;
    }

    /**
     * Create a new email token for email confirmation
     * @param user - The user requesting email confirmation
     * @returns The created email token
     */
    async createEmailConfirmationToken(user: User): Promise<EmailToken> {
        // Invalidate any existing confirmation tokens for this user
        await this.emailTokenRepository.update(
            { 
                userId: user.user_id, 
                type: EmailTokenType.EMAIL_CONFIRMATION,
                used: false 
            },
            { used: true }
        );

        // Create new token
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

        const emailToken = this.emailTokenRepository.create({
            token,
            type: EmailTokenType.EMAIL_CONFIRMATION,
            userId: user.user_id,
            expiresAt,
            used: false
        });

        const savedToken = await this.emailTokenRepository.save(emailToken);
        this.logger.log(`Created email confirmation token for user ${user.email}`);
        
        return savedToken;
    }

    /**
     * Create a new email token for staff invitation
     * @param user - The user being invited as staff
     * @returns The created email token
     */
    async createStaffInvitationToken(user: User): Promise<EmailToken> {
        // Invalidate any existing invitation tokens for this user
        await this.emailTokenRepository.update(
            { 
                userId: user.user_id, 
                type: EmailTokenType.STAFF_INVITATION,
                used: false 
            },
            { used: true }
        );

        // Create new token
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

        const emailToken = this.emailTokenRepository.create({
            token,
            type: EmailTokenType.STAFF_INVITATION,
            userId: user.user_id,
            expiresAt,
            used: false
        });

        const savedToken = await this.emailTokenRepository.save(emailToken);
        this.logger.log(`Created staff invitation token for user ${user.email}`);
        
        return savedToken;
    }

    /**
     * Validate and retrieve a token
     * @param token - The token to validate
     * @param type - The expected token type
     * @returns The email token if valid, null otherwise
     */
    async validateToken(token: string, type: EmailTokenType): Promise<EmailToken | null> {
        const emailToken = await this.emailTokenRepository.findOne({
            where: { token, type },
            relations: ['user']
        });

        if (!emailToken) {
            this.logger.warn(`Token not found: ${token}`);
            return null;
        }

        if (!emailToken.isValid()) {
            this.logger.warn(`Invalid token: ${token} (used: ${emailToken.used}, expired: ${emailToken.isExpired()})`);
            return null;
        }

        return emailToken;
    }

    /**
     * Find email token by token string and type
     * @param token - The token string to find
     * @param type - The type of token to find
     * @returns The email token or null if not found
     */
    async findByToken(token: string, type: EmailTokenType): Promise<EmailToken | null> {
        return await this.emailTokenRepository.findOne({
            where: { token, type, used: false }
        });
    }

    /**
     * Mark a token as used
     * @param token - The token string to mark as used
     */
    async markTokenAsUsed(token: string): Promise<void> {
        await this.emailTokenRepository.update(
            { token },
            { used: true, usedAt: new Date() }
        );
    }

    /**
     * Clean up expired tokens
     * @returns Number of tokens cleaned up
     */
    async cleanupExpiredTokens(): Promise<number> {
        const result = await this.emailTokenRepository.delete({
            expiresAt: new Date()
        });

        this.logger.log(`Cleaned up ${result.affected} expired tokens`);
        return result.affected || 0;
    }

    /**
     * Get all active tokens for a user
     * @param userId - The user ID
     * @returns Array of active tokens
     */
    async getUserTokens(userId: string): Promise<EmailToken[]> {
        return this.emailTokenRepository.find({
            where: { userId, used: false },
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Revoke all tokens for a user
     * @param userId - The user ID
     * @returns Number of tokens revoked
     */
    async revokeUserTokens(userId: string): Promise<number> {
        const result = await this.emailTokenRepository.update(
            { userId, used: false },
            { used: true }
        );

        this.logger.log(`Revoked ${result.affected} tokens for user ${userId}`);
        return result.affected || 0;
    }
} 