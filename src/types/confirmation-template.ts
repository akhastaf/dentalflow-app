/**
 * Template parameters for email confirmation
 */
export interface ConfirmationTemplate {
    /** Company logo URL (optional) */
    companyLogo?: string;
    /** Company name */
    companyName: string;
    /** User's first name */
    userName: string;
    /** Email confirmation link */
    confirmationLink: string;
    /** Expiry time for the confirmation link */
    expiryTime: string;
    /** Current year */
    currentYear: string;
    /** Company address */
    companyAddress: string;
    /** Unsubscribe link (optional) */
    unsubscribeLink?: string;
}