export interface StaffDeactivationTemplate {
  // Common email parameters
  companyLogo?: string;
  companyName: string;
  companyAddress?: string;
  currentYear: string;
  unsubscribeLink?: string;
  
  // Staff deactivation specific parameters
  userName: string;
  clinicName: string;
  role: string;
  deactivationDate: string;
  deactivatedBy: string;
  contactEmail?: string;
  contactPhone?: string;
} 