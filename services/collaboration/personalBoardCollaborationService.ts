import { 
  PersonalBoardCollaborator, 
  PersonalBoardInvitation, 
  PersonalBoardAccess, 
  PersonalBoardSettings,
  PERSONAL_BOARD_ROLE_PERMISSIONS
} from "@/types/personal-board-collaboration";

class PersonalBoardCollaborationService {
  /**
   * Get personal board settings for a user
   */
  async getPersonalBoardSettings(userId: string): Promise<PersonalBoardSettings> {
    try {
      const response = await fetch(`/api/users/${userId}/personal-board/settings`);
      
      if (!response.ok) {
        // Return defaults if settings don't exist yet
        return {
          isPrivate: false,
          allowCollaborators: true,
          defaultCollaboratorRole: 'viewer',
          requireApproval: false,
          maxCollaborators: 10
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching personal board settings:", error);
      // Return defaults on error
      return {
        isPrivate: false,
        allowCollaborators: true,
        defaultCollaboratorRole: 'viewer',
        requireApproval: false,
        maxCollaborators: 10
      };
    }
  }

  /**
   * Update personal board settings
   */
  async updatePersonalBoardSettings(
    userId: string, 
    settings: Partial<PersonalBoardSettings>
  ): Promise<PersonalBoardSettings> {
    try {
      const response = await fetch(`/api/users/${userId}/personal-board/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update personal board settings");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating personal board settings:", error);
      throw error;
    }
  }

  /**
   * Get collaborators for a user's personal board
   */
  async getPersonalBoardCollaborators(userId: string): Promise<PersonalBoardCollaborator[]> {
    try {
      const response = await fetch(`/api/users/${userId}/personal-board/collaborators`);
      
      if (!response.ok) {
        return [];
      }
      
      const collaborators = await response.json();
      return collaborators.map((collaborator: any) => ({
        ...collaborator,
        invitedAt: new Date(collaborator.invitedAt),
        acceptedAt: collaborator.acceptedAt ? new Date(collaborator.acceptedAt) : undefined
      }));
    } catch (error) {
      console.error("Error fetching personal board collaborators:", error);
      return [];
    }
  }

  /**
   * Invite a collaborator to personal board
   */
  async inviteCollaborator(
    boardOwnerId: string,
    email: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<PersonalBoardInvitation> {
    try {
      const response = await fetch(`/api/users/${boardOwnerId}/personal-board/collaborators/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          email, 
          role,
          supportEmail: "support@taskflow-ai.tech"
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to invite collaborator");
      }
      
      const invitation = await response.json();
      return {
        ...invitation,
        createdAt: new Date(invitation.createdAt),
        expiresAt: new Date(invitation.expiresAt)
      };
    } catch (error) {
      console.error("Error inviting collaborator:", error);
      throw error;
    }
  }

  /**
   * Remove a collaborator from personal board
   */
  async removeCollaborator(
    boardOwnerId: string,
    collaboratorId: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `/api/users/${boardOwnerId}/personal-board/collaborators/${collaboratorId}`,
        {
          method: "DELETE"
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to remove collaborator");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error removing collaborator:", error);
      throw error;
    }
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    boardOwnerId: string,
    collaboratorId: string,
    newRole: 'viewer' | 'editor' | 'admin'
  ): Promise<PersonalBoardCollaborator> {
    try {
      const response = await fetch(
        `/api/users/${boardOwnerId}/personal-board/collaborators/${collaboratorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role: newRole })
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to update collaborator role");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating collaborator role:", error);
      throw error;
    }
  }

  /**
   * Accept personal board invitation
   */
  async acceptInvitation(
    invitationCode: string,
    userId: string
  ): Promise<{ success: boolean; boardOwnerId: string }> {
    try {
      const response = await fetch(`/api/personal-board/invitations/${invitationCode}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept invitation");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }

  /**
   * Decline personal board invitation
   */
  async declineInvitation(invitationCode: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/personal-board/invitations/${invitationCode}/decline`, {
        method: "PUT"
      });
      
      if (!response.ok) {
        throw new Error("Failed to decline invitation");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error declining invitation:", error);
      throw error;
    }
  }

  /**
   * Get pending invitations for a user
   */
  async getPendingInvitations(userId: string): Promise<PersonalBoardInvitation[]> {
    try {
      const response = await fetch(`/api/users/${userId}/personal-board/invitations`);
      
      if (!response.ok) {
        return [];
      }
      
      const invitations = await response.json();
      return invitations.map((invitation: any) => ({
        ...invitation,
        createdAt: new Date(invitation.createdAt),
        expiresAt: new Date(invitation.expiresAt)
      }));
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      return [];
    }
  }

  /**
   * Get boards where user is a collaborator
   */
  async getCollaboratingBoards(userId: string): Promise<Array<{
    boardOwnerId: string;
    boardOwnerName: string;
    boardOwnerEmail: string;
    role: string;
    permissions: string[];
    acceptedAt: Date;
  }>> {
    try {
      const response = await fetch(`/api/users/${userId}/collaborating-boards`);
      
      if (!response.ok) {
        return [];
      }
      
      const boards = await response.json();
      return boards.map((board: any) => ({
        ...board,
        acceptedAt: new Date(board.acceptedAt)
      }));
    } catch (error) {
      console.error("Error fetching collaborating boards:", error);
      return [];
    }
  }

  /**
   * Check user's access permissions for a personal board
   */
  async getPersonalBoardAccess(
    boardOwnerId: string,
    userId: string
  ): Promise<PersonalBoardAccess> {
    try {
      const response = await fetch(
        `/api/users/${boardOwnerId}/personal-board/access?userId=${userId}`
      );
      
      if (!response.ok) {
        // Return no access if error
        return {
          canView: false,
          canEdit: false,
          canManageCollaborators: false,
          canManageSettings: false,
          canDelete: false
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error checking personal board access:", error);
      return {
        canView: false,
        canEdit: false,
        canManageCollaborators: false,
        canManageSettings: false,
        canDelete: false
      };
    }
  }

  /**
   * Check if user has specific permission for a personal board
   */
  hasPermission(
    role: 'viewer' | 'editor' | 'admin',
    permission: string
  ): boolean {
    const permissions = PERSONAL_BOARD_ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission as any);
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: 'viewer' | 'editor' | 'admin'): readonly string[] {
    return PERSONAL_BOARD_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Bulk remove collaborators
   */
  async bulkRemoveCollaborators(
    boardOwnerId: string,
    collaboratorIds: string[]
  ): Promise<{ success: boolean; removed: string[]; failed: string[] }> {
    try {
      const response = await fetch(
        `/api/users/${boardOwnerId}/personal-board/collaborators/bulk-remove`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ collaboratorIds })
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to bulk remove collaborators");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error bulk removing collaborators:", error);
      throw error;
    }
  }

  /**
   * Bulk update collaborator roles
   */
  async bulkUpdateCollaboratorRoles(
    boardOwnerId: string,
    updates: Array<{ collaboratorId: string; role: 'viewer' | 'editor' | 'admin' }>
  ): Promise<{ success: boolean; updated: string[]; failed: string[] }> {
    try {
      const response = await fetch(
        `/api/users/${boardOwnerId}/personal-board/collaborators/bulk-update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ updates })
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to bulk update collaborator roles");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error bulk updating collaborator roles:", error);
      throw error;
    }
  }

  /**
   * Get personal board collaboration stats
   */
  async getCollaborationStats(userId: string): Promise<{
    totalCollaborators: number;
    activeCollaborators: number;
    pendingInvitations: number;
    collaboratingBoards: number;
  }> {
    try {
      const response = await fetch(`/api/users/${userId}/personal-board/stats`);
      
      if (!response.ok) {
        return {
          totalCollaborators: 0,
          activeCollaborators: 0,
          pendingInvitations: 0,
          collaboratingBoards: 0
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching collaboration stats:", error);
      return {
        totalCollaborators: 0,
        activeCollaborators: 0,
        pendingInvitations: 0,
        collaboratingBoards: 0
      };
    }
  }
}

export const personalBoardCollaborationService = new PersonalBoardCollaborationService();
