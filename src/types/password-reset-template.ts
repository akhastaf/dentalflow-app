/**
 * Template parameters for password reset email
 */
export interface PasswordResetTemplate {
    /** Company logo URL (optional) */
    companyLogo?: string;
    /** Company name */
    companyName: string;
    /** User's first name */
    userName: string;
    /** Password reset link */
    resetLink: string;
    /** Expiry time for the reset link */
    expiryTime: string;
    /** Company address */
    companyAddress: string;
    /** Unsubscribe link (optional) */
    unsubscribeLink?: string;
}