export interface OrganizationSecurity {
  passwordRequired: boolean;
  password?: string;
  twoFactorEnabled: boolean;
  allowedDomains: string[];
  sessionTimeout: number; // in minutes
  enforceStrongPasswords: boolean;
}

export interface OwnershipTransfer {
  id: string;
  organizationId: string;
  currentOwnerId: string;
  newOwnerId: string;
  newOwnerEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  verificationCode?: string;
}

export interface SecurityAuditLog {
  id: string;
  organizationId: string;
  action: 'password_change' | 'owner_transfer' | 'security_settings_change' | 'member_access';
  userId: string;
  userEmail: string;
  timestamp: Date;
  details: string;
  ipAddress?: string;
}
