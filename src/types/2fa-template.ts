/**
 * Template parameters for 2FA code email
 */
export interface TwoFactorAuthTemplate {
    /** Company logo URL (optional) */
    companyLogo?: string;
    /** Company name */
    companyName: string;
    /** User's first name */
    userName: string;
    /** The 2FA verification code */
    code: string;
    /** Expiry time in minutes */
    expiryTime: string;
    /** Company address */
    companyAddress: string;
    /** Current year */
    currentYear: string;
    /** Unsubscribe link (optional) */
    unsubscribeLink?: string;
} 