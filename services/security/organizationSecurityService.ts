import { 
  OrganizationSecurity, 
  OwnershipTransfer, 
  SecurityAuditLog 
} from "@/types/organization-security";

class OrganizationSecurityService {
  /**
   * Get security settings for an organization
   */
  async getSecuritySettings(organizationId: string): Promise<OrganizationSecurity> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/security`);
      
      if (!response.ok) {
        // Return defaults if settings don't exist yet
        return {
          passwordRequired: false,
          twoFactorEnabled: false,
          allowedDomains: [],
          sessionTimeout: 480, // 8 hours
          enforceStrongPasswords: true
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching security settings:", error);
      // Return defaults on error
      return {
        passwordRequired: false,
        twoFactorEnabled: false,
        allowedDomains: [],
        sessionTimeout: 480,
        enforceStrongPasswords: true
      };
    }
  }

  /**
   * Update security settings for an organization
   */
  async updateSecuritySettings(
    organizationId: string, 
    settings: Partial<OrganizationSecurity>
  ): Promise<OrganizationSecurity> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/security`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update security settings");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating security settings:", error);
      throw error;
    }
  }

  /**
   * Set or update organization password
   */
  async setOrganizationPassword(
    organizationId: string, 
    password: string,
    currentPassword?: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/security/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password, currentPassword })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to set organization password");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error setting organization password:", error);
      throw error;
    }
  }

  /**
   * Remove organization password
   */
  async removeOrganizationPassword(
    organizationId: string, 
    currentPassword: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/security/password`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentPassword })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove organization password");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error removing organization password:", error);
      throw error;
    }
  }

  /**
   * Initiate ownership transfer
   */
  async initiateOwnershipTransfer(
    organizationId: string,
    newOwnerEmail: string,
    currentOwnerPassword?: string
  ): Promise<OwnershipTransfer> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/transfer-ownership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          newOwnerEmail, 
          currentOwnerPassword,
          supportEmail: "support@taskflow-ai.tech"
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initiate ownership transfer");
      }
      
      const transfer = await response.json();
      return {
        ...transfer,
        createdAt: new Date(transfer.createdAt),
        expiresAt: new Date(transfer.expiresAt)
      };
    } catch (error) {
      console.error("Error initiating ownership transfer:", error);
      throw error;
    }
  }

  /**
   * Get pending ownership transfers for an organization
   */
  async getPendingTransfers(organizationId: string): Promise<OwnershipTransfer[]> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/transfer-ownership`);
      
      if (!response.ok) {
        return [];
      }
      
      const transfers = await response.json();
      return transfers.map((transfer: any) => ({
        ...transfer,
        createdAt: new Date(transfer.createdAt),
        expiresAt: new Date(transfer.expiresAt)
      }));
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      return [];
    }
  }

  /**
   * Cancel a pending ownership transfer
   */
  async cancelOwnershipTransfer(transferId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/ownership-transfers/${transferId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to cancel ownership transfer");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error canceling ownership transfer:", error);
      throw error;
    }
  }

  /**
   * Accept ownership transfer (called by new owner)
   */
  async acceptOwnershipTransfer(
    transferId: string, 
    verificationCode: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/ownership-transfers/${transferId}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ verificationCode })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept ownership transfer");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error accepting ownership transfer:", error);
      throw error;
    }
  }

  /**
   * Get security audit logs for an organization
   */
  async getSecurityAuditLogs(
    organizationId: string,
    limit: number = 50
  ): Promise<SecurityAuditLog[]> {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/security/audit-logs?limit=${limit}`
      );
      
      if (!response.ok) {
        return [];
      }
      
      const logs = await response.json();
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    } catch (error) {
      console.error("Error fetching security audit logs:", error);
      return [];
    }
  }

  /**
   * Verify organization password
   */
  async verifyOrganizationPassword(
    organizationId: string, 
    password: string
  ): Promise<{ valid: boolean }> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/security/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) {
        return { valid: false };
      }
      
      const result = await response.json();
      return { valid: result.valid };
    } catch (error) {
      console.error("Error verifying organization password:", error);
      return { valid: false };
    }
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { 
    isStrong: boolean; 
    score: number; 
    feedback: string[] 
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Password should be at least 8 characters long");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include lowercase letters");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include uppercase letters");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include numbers");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include special characters");
    }

    const isStrong = score >= 4;
    
    return { isStrong, score, feedback };
  }
}

export const organizationSecurityService = new OrganizationSecurityService();
