// Email notification types - only for organization invitations
export interface EmailNotificationSettings {
  userId: string;
  organizationInvites: {
    enabled: boolean;
    emailEnabled: boolean;
  };
  // All other notifications are in-app only
  inAppOnly: boolean;
}

export interface OrganizationInviteEmail {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
  role: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailNotificationSettings = {
  userId: '',
  organizationInvites: {
    enabled: true,
    emailEnabled: true
  },
  inAppOnly: true // All other notifications are in-app only
};
