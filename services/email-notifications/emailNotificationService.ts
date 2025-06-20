import { EmailNotificationSettings, OrganizationInviteEmail, EmailTemplate } from '@/types/email-notifications';
import { sendOrganizationInvitation } from '@/lib/email';

/**
 * Email Notification Service - Handles ONLY organization invitations via email
 * All other notifications are in-app only
 */
class EmailNotificationService {
  private static instance: EmailNotificationService;

  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Send organization invitation email
   * This is the ONLY email notification type supported
   */
  async sendOrganizationInviteEmail(invitation: OrganizationInviteEmail): Promise<boolean> {
    try {
      console.log('Sending organization invitation email to:', invitation.to);
      
      await sendOrganizationInvitation({
        to: invitation.to,
        organizationName: invitation.organizationName,
        inviterName: invitation.inviterName,
        inviteUrl: invitation.inviteUrl,
        expiresAt: invitation.expiresAt
      });

      return true;
    } catch (error) {
      console.error('Failed to send organization invitation email:', error);
      return false;
    }
  }

  /**
   * Get user email notification settings
   */
  async getEmailSettings(userId: string): Promise<EmailNotificationSettings> {
    try {
      const response = await fetch(`/api/users/${userId}/email-settings`);
      if (!response.ok) {
        return this.getDefaultSettings(userId);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching email settings:', error);
      return this.getDefaultSettings(userId);
    }
  }

  /**
   * Update user email notification settings
   */
  async updateEmailSettings(
    userId: string, 
    settings: Partial<EmailNotificationSettings>
  ): Promise<EmailNotificationSettings> {
    try {
      const response = await fetch(`/api/users/${userId}/email-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update email settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating email settings:', error);
      throw error;
    }
  }

  /**
   * Check if organization invite emails are enabled for user
   */
  async shouldSendOrganizationInviteEmail(userId: string): Promise<boolean> {
    try {
      const settings = await this.getEmailSettings(userId);
      return settings.organizationInvites.enabled && settings.organizationInvites.emailEnabled;
    } catch (error) {
      console.error('Error checking email settings:', error);
      return true; // Default to enabled if error
    }
  }

  /**
   * Get default email settings for new users
   */
  private getDefaultSettings(userId: string): EmailNotificationSettings {
    return {
      userId,
      organizationInvites: {
        enabled: true,
        emailEnabled: true
      },
      inAppOnly: true
    };
  }

  /**
   * Generate organization invitation email template
   */
  generateOrganizationInviteTemplate(invitation: OrganizationInviteEmail): EmailTemplate {
    const subject = `You're invited to join ${invitation.organizationName} on TaskFlow`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🚀 Organization Invitation</h2>
        <p>Hi there!</p>
        <p><strong>${invitation.inviterName}</strong> has invited you to join <strong>${invitation.organizationName}</strong> as a <strong>${invitation.role}</strong> on TaskFlow.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitation.inviteUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p><strong>⏰ This invitation expires on:</strong> ${invitation.expiresAt.toLocaleDateString()}</p>
        <p>If you don't have a TaskFlow account, you'll be able to create one when accepting the invitation.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This invitation was sent by ${invitation.inviterName} via TaskFlow.<br>
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `;

    const text = `
You're invited to join ${invitation.organizationName} on TaskFlow!

${invitation.inviterName} has invited you to join ${invitation.organizationName} as a ${invitation.role}.

Accept your invitation: ${invitation.inviteUrl}

This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.

If you don't have a TaskFlow account, you'll be able to create one when accepting the invitation.

---
This invitation was sent by ${invitation.inviterName} via TaskFlow.
If you didn't expect this invitation, you can safely ignore this email.
    `;

    return { subject, html, text };
  }
}

export const emailNotificationService = EmailNotificationService.getInstance();
