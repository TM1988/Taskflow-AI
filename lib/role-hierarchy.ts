// Enhanced role hierarchy system with rank-based permissions
export interface RoleHierarchy {
  id: string;
  name: string;
  rank: number; // Lower number = higher authority (1 = highest)
  permissions: string[];
  description: string;
  color: string;
  canManageRoles?: boolean;
  isSystemRole?: boolean;
  maxMemberCount?: number; // Optional limit for role assignment
  requiresApproval?: boolean; // Requires owner approval for assignment
  inheritedRoles?: string[]; // Roles that inherit permissions from this role
}

export const SYSTEM_ROLES: RoleHierarchy[] = [
  {
    id: "owner",
    name: "Owner",
    rank: 1,
    permissions: ["*"], // All permissions
    description: "Full control over the organization with complete administrative access",
    color: "amber",
    canManageRoles: true,
    isSystemRole: true,
    maxMemberCount: 1, // Only one owner per organization
  },
  {
    id: "admin",
    name: "Admin", 
    rank: 2,
    permissions: [
      "projects.create",
      "projects.edit", 
      "projects.delete",
      "projects.view",
      "members.invite",
      "members.remove",
      "members.roles.edit",
      "org.settings.edit",
      "org.billing.view",
      "analytics.view",
      "bulk.actions.members",
      "bulk.actions.tasks",
    ],
    description: "Can manage projects, members, and organization settings",
    color: "blue",
    canManageRoles: true,
    isSystemRole: true,
    maxMemberCount: 5, // Up to 5 admins
    requiresApproval: true, // Owner must approve admin promotions
  },
  {
    id: "moderator",
    name: "Moderator",
    rank: 3,
    permissions: [
      "projects.create",
      "projects.edit",
      "projects.view", 
      "members.invite",
      "tasks.create",
      "tasks.edit",
      "tasks.delete",
      "tasks.moderate",
      "bulk.actions.tasks",
    ],
    description: "Can moderate content, manage tasks, and invite new members",
    color: "green",
    canManageRoles: false,
    isSystemRole: true,
    maxMemberCount: 10, // Up to 10 moderators
  },
  {
    id: "member",
    name: "Member",
    rank: 4,
    permissions: [
      "projects.view",
      "tasks.create",
      "tasks.edit",
      "tasks.view",
      "tasks.comment",
      "profile.edit",
    ],
    description: "Standard member with basic project and task access",
    color: "gray",
    canManageRoles: false,
    isSystemRole: true,
  },
  {
    id: "viewer",
    name: "Viewer", 
    rank: 5,
    permissions: [
      "projects.view",
      "tasks.view",
      "tasks.comment",
    ],
    description: "Read-only access to projects and tasks",
    color: "slate",
    canManageRoles: false,
    isSystemRole: true,
  },
];

export class RoleHierarchyManager {
  private roles: RoleHierarchy[];

  constructor(customRoles: RoleHierarchy[] = []) {
    // Combine system roles with custom roles, sorted by rank
    this.roles = [...SYSTEM_ROLES, ...customRoles].sort((a, b) => a.rank - b.rank);
  }

  // Check if user can manage a specific role
  canManageRole(userRole: string, targetRole: string): boolean {
    const userRoleData = this.roles.find(r => r.id === userRole);
    const targetRoleData = this.roles.find(r => r.id === targetRole);

    if (!userRoleData || !targetRoleData) return false;

    // Can't manage owner role unless you are owner
    if (targetRoleData.id === "owner" && userRoleData.id !== "owner") return false;

    // Owner can manage all roles
    if (userRoleData.id === "owner") return true;

    // Can only manage roles with higher rank numbers (lower authority)
    return (userRoleData.canManageRoles ?? false) && userRoleData.rank < targetRoleData.rank;
  }

  // Check if user has a specific permission
  hasPermission(userRole: string, permission: string): boolean {
    const roleData = this.roles.find(r => r.id === userRole);
    if (!roleData) return false;

    // Owner has all permissions
    if (roleData.permissions.includes("*")) return true;

    return roleData.permissions.includes(permission);
  }

  // Get all roles that a user can assign to others
  getAssignableRoles(userRole: string): RoleHierarchy[] {
    const userRoleData = this.roles.find(r => r.id === userRole);
    if (!userRoleData) return [];

    if (userRoleData.id === "owner") {
      // Owner can assign all roles except owner
      return this.roles.filter(r => r.id !== "owner");
    }

    if (!userRoleData.canManageRoles) return [];

    // Can assign roles with higher rank numbers (lower authority)
    return this.roles.filter(r => r.rank > userRoleData.rank);
  }

  // Get role hierarchy for display
  getRoleHierarchy(): RoleHierarchy[] {
    return this.roles;
  }

  // Get role by ID
  getRole(roleId: string): RoleHierarchy | undefined {
    return this.roles.find(r => r.id === roleId);
  }

  // Check if a role can perform bulk actions
  canPerformBulkActions(userRole: string): boolean {
    return this.hasPermission(userRole, "bulk.actions.members") || 
           this.hasPermission(userRole, "bulk.actions.tasks");
  }

  // Validate role assignment considering limits
  validateRoleAssignment(assignerRole: string, targetRole: string, currentRoleCounts: Record<string, number>): {
    valid: boolean;
    error?: string;
  } {
    if (!this.canManageRole(assignerRole, targetRole)) {
      return {
        valid: false,
        error: "You don't have permission to assign this role"
      };
    }

    const targetRoleData = this.getRole(targetRole);
    if (!targetRoleData) {
      return {
        valid: false, 
        error: "Invalid role specified"
      };
    }

    // Check if role has member limit
    if (targetRoleData.maxMemberCount) {
      const currentCount = currentRoleCounts[targetRole] || 0;
      if (currentCount >= targetRoleData.maxMemberCount) {
        return {
          valid: false,
          error: `Maximum ${targetRoleData.maxMemberCount} ${targetRoleData.name}(s) allowed`
        };
      }
    }

    // Check if role requires approval
    if (targetRoleData.requiresApproval && assignerRole !== "owner") {
      return {
        valid: false,
        error: "This role assignment requires owner approval"
      };
    }

    return { valid: true };
  }

  // Get role color for UI display
  getRoleColor(roleId: string): string {
    const role = this.getRole(roleId);
    return role?.color || "gray";
  }

  // Check if user can invite members
  canInviteMembers(userRole: string): boolean {
    return this.hasPermission(userRole, "members.invite");
  }

  // Check if user can remove members
  canRemoveMembers(userRole: string): boolean {
    return this.hasPermission(userRole, "members.remove");
  }

  // Check if user can create projects
  canCreateProjects(userRole: string): boolean {
    return this.hasPermission(userRole, "projects.create");
  }

  // Check if user can edit organization settings
  canEditOrgSettings(userRole: string): boolean {
    return this.hasPermission(userRole, "org.settings.edit");
  }

  // Get highest ranking role (lowest rank number)
  getHighestRole(): RoleHierarchy {
    return this.roles[0]; // Already sorted by rank
  }

  // Get lowest ranking role (highest rank number) 
  getLowestRole(): RoleHierarchy {
    return this.roles[this.roles.length - 1];
  }

  // Compare two roles and return the higher authority one
  getHigherAuthorityRole(role1: string, role2: string): string | null {
    const roleData1 = this.getRole(role1);
    const roleData2 = this.getRole(role2);
    
    if (!roleData1 || !roleData2) return null;
    
    return roleData1.rank < roleData2.rank ? role1 : role2;
  }

  // Check if role can escalate issues
  canEscalateIssues(userRole: string): boolean {
    return this.hasPermission(userRole, "escalation.create") || 
           this.hasPermission(userRole, "support.advanced");
  }

  // Get permissions that a role inherits
  getInheritedPermissions(roleId: string): string[] {
    const role = this.getRole(roleId);
    if (!role || !role.inheritedRoles) return [];

    const inheritedPermissions: string[] = [];
    role.inheritedRoles.forEach(inheritedRoleId => {
      const inheritedRole = this.getRole(inheritedRoleId);
      if (inheritedRole) {
        inheritedPermissions.push(...inheritedRole.permissions);
      }
    });

    return Array.from(new Set(inheritedPermissions)); // Remove duplicates
  }

  // Get all effective permissions for a role (including inherited)
  getEffectivePermissions(roleId: string): string[] {
    const role = this.getRole(roleId);
    if (!role) return [];

    const directPermissions = role.permissions;
    const inheritedPermissions = this.getInheritedPermissions(roleId);
    
    return Array.from(new Set([...directPermissions, ...inheritedPermissions]));
  }
}

// Utility function to create role hierarchy manager
export function createRoleHierarchyManager(customRoles: RoleHierarchy[] = []) {
  return new RoleHierarchyManager(customRoles);
}

// Default instance for common use
export const defaultRoleHierarchy = new RoleHierarchyManager();
