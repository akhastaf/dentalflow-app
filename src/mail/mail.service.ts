import { Injectable, Logger } from "@nestjs/common";
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';
import * as handlebars from 'handlebars';
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { ConfirmationTemplate } from "src/types/confirmation-template";
import { PasswordResetTemplate } from "src/types/password-reset-template";
import { TwoFactorAuthTemplate } from "src/types/2fa-template";
import { JwtPayload } from "src/types/jwt-payload";
import { User } from "src/user/entities/user.entity";
import { EmailTokenService } from "./email-token.service";
import { EmailTokenType } from "src/database/entities/email-token.entity";

/**
 * Mail Service for handling all email communications
 * 
 * This service provides methods for sending various types of transactional emails
 * including user confirmation, password reset, and two-factor authentication codes.
 * All emails are sent using Resend and use Handlebars templates for consistency.
 * 
 * Email confirmation uses JWT tokens for simplicity, while password reset uses
 * database tokens for enhanced security and revocability.
 * 
 * @example
 * ```typescript
 * // Send confirmation email (uses JWT)
 * await mailService.sendUserConfirmation(user);
 * 
 * // Send password reset email (uses database token)
 * await mailService.sendPasswordReset(user);
 * 
 * // Send 2FA code
 * await mailService.send2FACode(user.email, '123456');
 * ```
 */
@Injectable()
export class MailService {
    private readonly logger: Logger = new Logger(MailService.name);

    private resend: Resend;
    private confirmationTemplate: handlebars.TemplateDelegate;
    private passwordResetTemplate: handlebars.TemplateDelegate;
    private twoFactorAuthTemplate: handlebars.TemplateDelegate;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly emailTokenService: EmailTokenService
    ) {
        this.initializeResend();
        this.loadTemplates();
    }

    /**
     * Initialize Resend client with API token
     * @private
     */
    private initializeResend(): void {
        const resendToken = this.configService.get<string>('RESEND_TOKEN');
        if (!resendToken) {
            this.logger.error('RESEND_TOKEN is not configured');
            throw new Error('RESEND_TOKEN is required for email functionality');
        }
        this.resend = new Resend(resendToken);
    }

    /**
     * Load and compile all email templates
     * @private
     */
    private loadTemplates(): void {
        try {
            const templatesDir = this.configService.get<string>("EMAIL_TEMPLATE_DIR") ?? 'templates';
            const templatesPath = path.join(__dirname, templatesDir);

            this.confirmationTemplate = this.loadTemplate(path.join(templatesPath, 'confirmation.hbs'));
            this.passwordResetTemplate = this.loadTemplate(path.join(templatesPath, 'password-reset.hbs'));
            this.twoFactorAuthTemplate = this.loadTemplate(path.join(templatesPath, '2fa-code.hbs'));

            this.logger.log('All email templates loaded successfully');
        } catch (error) {
            this.logger.error('Failed to load email templates:', error);
            throw new Error(`Template loading failed: ${error.message}`);
        }
    }

    /**
     * Load and compile a single Handlebars template
     * @param templatePath - Path to the template file
     * @returns Compiled Handlebars template
     * @private
     */
    private loadTemplate(templatePath: string): handlebars.TemplateDelegate {
        try {
            const templateSource = fs.readFileSync(templatePath, 'utf8');
            return handlebars.compile(templateSource);
        } catch (error) {
            this.logger.error(`Failed to load template ${templatePath}:`, error);
            throw new Error(`Template ${templatePath} not found or invalid`);
        }
    }

    /**
     * Get common email parameters used across all templates
     * @returns Common template parameters
     * @private
     */
    private getCommonEmailParams(): Record<string, string> {
        return {
            companyLogo: this.configService.get<string>('COMPANY_LOGO') ?? '',
            companyName: this.configService.get<string>('COMPANY_NAME') ?? 'DentalFlow',
            companyAddress: this.configService.get<string>('COMPANY_ADDRESS') ?? '',
            currentYear: new Date().getFullYear().toString(),
            unsubscribeLink: this.configService.get<string>('UNSUBSCRIBE_LINK') ?? ''
        };
    }

    /**
     * Send email using Resend with error handling
     * @param emailData - Email data including to, subject, and html
     * @returns Promise that resolves when email is sent
     * @private
     */
    private async sendEmail(emailData: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        const fromEmail = this.configService.get<string>("DEFAULT_EMAIL") || 'noreply@dentistflow.com';
        
        try {
            const { data } = await this.resend.emails.send({
                from: `Abderrzzaq <${fromEmail}>`,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
            });
            console.log(data);
            this.logger.log(`Email sent successfully to ${emailData.to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${emailData.to}:`, error);
            throw new Error(`Email sending failed: ${error.message}`);
        }
    }

    /**
     * Send user confirmation email using JWT token
     * 
     * Sends a confirmation email to newly registered users with a JWT token
     * that allows them to verify their email address.
     * 
     * @param user - User entity containing email and user_id
     * @returns Promise that resolves when email is sent
     * 
     * @example
     * ```typescript
     * const user = await userService.createUser(userData);
     * await mailService.sendUserConfirmation(user);
     * ```
     */
    async sendUserConfirmation(user: User): Promise<void> {
        this.logger.log(`Sending confirmation email to ${user.email}`);

        try {
            // Generate JWT token for email confirmation
            const payload: JwtPayload = {
                email: user.email,
                sub: user.user_id
            };
            
            const jwtOptions: JwtSignOptions = {
                secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
                expiresIn: this.configService.get<string>('JWT_EMAIL_VERIFICATION_EXPIRATION') || '24h'
            };

            const token = await this.jwtService.signAsync(payload, jwtOptions);
            const confirmationLink = `${this.configService.get<string>("CLIENT_URL")}/auth/email-confirmation/${token}`;

            // Prepare template parameters
            const templateParams: ConfirmationTemplate = {
                ...this.getCommonEmailParams(),
                confirmationLink,
                expiryTime: this.configService.get<string>('JWT_EMAIL_VERIFICATION_EXPIRATION') || '24 hours',
                userName: user.first_name || user.email
            } as ConfirmationTemplate;

            // Generate HTML from template
            const html = this.confirmationTemplate(templateParams);

            // Send email
            await this.sendEmail({
                to: user.email,
                subject: 'Welcome to DentalFlow! Confirm your Email',
                html
            });

        } catch (error) {
            this.logger.error(`Failed to send confirmation email to ${user.email}:`, error);
            throw error;
        }
    }

    /**
     * Send password reset email using database token
     * 
     * Sends a password reset email with a secure database token that allows users
     * to reset their password. The token is stored in the database and can be revoked.
     * 
     * @param user - User entity containing email and first_name
     * @returns Promise that resolves when email is sent
     * 
     * @example
     * ```typescript
     * await mailService.sendPasswordReset(user);
     * ```
     */
    async sendPasswordReset(user: User): Promise<void> {
        this.logger.log(`Sending password reset email to ${user.email}`);

        try {
            // Create database token for password reset
            const emailToken = await this.emailTokenService.createPasswordResetToken(user);
            const resetLink = `${this.configService.get<string>("CLIENT_URL")}/auth/reset-password?token=${emailToken.token}`;

            // Prepare template parameters
            const templateParams: PasswordResetTemplate = {
                ...this.getCommonEmailParams(),
                userName: user.first_name || user.email,
                resetLink,
                expiryTime: '1 hour'
            } as PasswordResetTemplate;

            // Generate HTML from template
            const html = this.passwordResetTemplate(templateParams);

            // Send email
            await this.sendEmail({
                to: user.email,
                subject: 'Reset Your DentalFlow Password',
                html
            });

        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${user.email}:`, error);
            throw error;
        }
    }

    /**
     * Send password reset email with JWT token (Legacy method)
     * 
     * Alternative method that generates a JWT token for password reset.
     * This method is kept for backward compatibility but is deprecated.
     * 
     * @param user - User entity containing email and user_id
     * @param resetToken - Pre-generated reset token
     * @returns Promise that resolves when email is sent
     * 
     * @deprecated Use sendPasswordReset(user) instead
     */
    async sendPasswordResetWithToken(user: User, resetToken: string): Promise<void> {
        this.logger.warn('sendPasswordResetWithToken is deprecated. Use sendPasswordReset(user) instead.');
        
        try {
            const resetLink = `${this.configService.get<string>("CLIENT_URL")}/auth/reset-password?token=${resetToken}`;

            // Prepare template parameters
            const templateParams: PasswordResetTemplate = {
                ...this.getCommonEmailParams(),
                userName: user.first_name || user.email,
                resetLink,
                expiryTime: this.configService.get<string>('RESET_PASSWORD_EXPIRATION') || '1 hour'
            } as PasswordResetTemplate;

            // Generate HTML from template
            const html = this.passwordResetTemplate(templateParams);

            // Send email
            await this.sendEmail({
                to: user.email,
                subject: 'Reset Your DentalFlow Password',
                html
            });

        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${user.email}:`, error);
            throw error;
        }
    }

    /**
     * Send password reset email with JWT token (Legacy method)
     * 
     * Alternative method that generates a JWT token for password reset.
     * This method is kept for backward compatibility but is deprecated.
     * 
     * @param user - User entity containing email and user_id
     * @returns Promise that resolves when email is sent
     * 
     * @deprecated Use sendPasswordReset(user) instead
     */
    async sendResetPassword(user: User): Promise<void> {
        this.logger.warn('sendResetPassword is deprecated. Use sendPasswordReset(user) instead.');
        
        try {
            // Generate JWT token for password reset
            const payload: JwtPayload = {
                email: user.email,
                sub: user.user_id
            };
            
            const jwtOptions: JwtSignOptions = {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: '1d'
            };

            const token = await this.jwtService.signAsync(payload, jwtOptions);
            
            // Delegate to the legacy method
            await this.sendPasswordResetWithToken(user, token);
            
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${user.email}:`, error);
            throw error;
        }
    }

    /**
     * Send two-factor authentication code email
     * 
     * Sends a 2FA verification code to the user's email address.
     * The code is displayed prominently and includes security warnings.
     * 
     * @param email - Recipient email address
     * @param code - 6-digit verification code
     * @param userName - User's first name (optional)
     * @returns Promise that resolves when email is sent
     * 
     * @example
     * ```typescript
     * const code = generate2FACode();
     * await mailService.send2FACode(user.email, code, user.first_name);
     * ```
     */
    async send2FACode(email: string, code: string, userName?: string): Promise<void> {
        this.logger.log(`Sending 2FA code to ${email}`);

        try {
            // Prepare template parameters
            const templateParams: TwoFactorAuthTemplate = {
                ...this.getCommonEmailParams(),
                userName: userName || email,
                code,
                expiryTime: this.configService.get<string>('2FA_CODE_EXPIRATION') || '10'
            } as TwoFactorAuthTemplate;

            // Generate HTML from template
            const html = this.twoFactorAuthTemplate(templateParams);

            // Send email
            await this.sendEmail({
                to: email,
                subject: 'Your DentalFlow 2FA Verification Code',
                html
            });

        } catch (error) {
            this.logger.error(`Failed to send 2FA code email to ${email}:`, error);
            throw error;
        }
    }

    /**
     * Send custom email with template
     * 
     * Generic method for sending emails with custom templates and parameters.
     * Useful for sending marketing emails or other custom communications.
     * 
     * @param to - Recipient email address
     * @param subject - Email subject
     * @param templateName - Name of the template file (without .hbs extension)
     * @param templateParams - Parameters to pass to the template
     * @returns Promise that resolves when email is sent
     * 
     * @example
     * ```typescript
     * await mailService.sendCustomEmail(
     *   'user@example.com',
     *   'Welcome to DentalFlow',
     *   'welcome',
     *   { userName: 'John', companyName: 'DentalFlow' }
     * );
     * ```
     */
    async sendCustomEmail(
        to: string,
        subject: string,
        templateName: string,
        templateParams: Record<string, any>
    ): Promise<void> {
        this.logger.log(`Sending custom email to ${to} using template ${templateName}`);

        try {
            // Load template dynamically
            const templatesDir = this.configService.get<string>("EMAIL_TEMPLATE_DIR") ?? 'templates';
            const templatePath = path.join(__dirname, templatesDir, `${templateName}.hbs`);
            const template = this.loadTemplate(templatePath);

            // Merge with common parameters
            const params = {
                ...this.getCommonEmailParams(),
                ...templateParams
            };

            // Generate HTML from template
            const html = template(params);

            // Send email
            await this.sendEmail({
                to,
                subject,
                html
            });

        } catch (error) {
            this.logger.error(`Failed to send custom email to ${to}:`, error);
            throw error;
        }
    }
}