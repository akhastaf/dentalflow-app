export interface StaffInvitationTemplate {
  // Common email parameters
  companyLogo?: string;
  companyName: string;
  companyAddress?: string;
  currentYear: string;
  unsubscribeLink?: string;
  
  // Staff invitation specific parameters
  userName: string;
  clinicName: string;
  role: string;
  invitedBy: string;
  invitationDate: string;
  activationLink: string;
  expiryTime: string;
} 