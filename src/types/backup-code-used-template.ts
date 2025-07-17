/**
 * Template parameters for backup code used notification email
 */
export interface BackupCodeUsedTemplate {
    // Common email parameters
    companyLogo?: string;
    companyName: string;
    companyAddress: string;
    currentYear: string;
    unsubscribeLink?: string;
    
    // Specific to backup code used notification
    userName: string;
    currentTime: string;
    ipAddress: string;
} 