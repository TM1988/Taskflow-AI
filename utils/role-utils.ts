"use client";

export interface Role {
  id: string;
  name: string;
  description?: string;
  rank?: number;
  permissions?: any;
  isSystemRole?: boolean;
  isOwner?: boolean;
}

// Standard role definitions
export const STANDARD_ROLES: Role[] = [
  {
    id: "member",
    name: "Member",
    description: "Can view and participate in assigned projects",
    rank: 3,
    isSystemRole: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Can manage projects and invite other members",
    rank: 2,
    isSystemRole: true,
  },
  {
    id: "owner",
    name: "Owner",
    description: "Full access to organization settings and management",
    rank: 1,
    isSystemRole: true,
    isOwner: true,
  },
];

// Role validation functions
export function isOwnerRole(role: string | Role): boolean {
  if (typeof role === "string") {
    return role.toLowerCase() === "owner";
  }
  return role.isOwner === true || role.name.toLowerCase() === "owner";
}

export function canAssignRole(
  currentUserRole: string,
  targetRole: string,
): boolean {
  // Owner can assign any role except owner
  if (currentUserRole.toLowerCase() === "owner") {
    return !isOwnerRole(targetRole);
  }

  // Admin can only assign member role
  if (currentUserRole.toLowerCase() === "admin") {
    return targetRole.toLowerCase() === "member";
  }

  // Members cannot assign roles
  return false;
}

export function getSelectableRoles(
  currentUserRole: string,
  includeOwner = false,
): Role[] {
  const roles = STANDARD_ROLES.filter((role) => {
    // Never include owner role in selectable roles unless explicitly requested
    if (role.isOwner && !includeOwner) {
      return false;
    }

    return canAssignRole(currentUserRole, role.id);
  });

  return roles;
}

export function filterRolesForInvitation(roles: Role[]): Role[] {
  return roles.filter((role) => !isOwnerRole(role));
}

export function filterRolesForRoleChange(
  roles: Role[],
  currentUserRole: string,
): Role[] {
  return roles.filter((role) => {
    // Never allow selecting owner role
    if (isOwnerRole(role)) {
      return false;
    }

    // Check if current user can assign this role
    return canAssignRole(currentUserRole, role.id);
  });
}

export function validateRoleAssignment(
  currentUserRole: string,
  targetRole: string,
  context: "invitation" | "role_change" | "general",
): { valid: boolean; error?: string } {
  // Owner role can never be assigned through these interfaces
  if (isOwnerRole(targetRole)) {
    return {
      valid: false,
      error: "Owner role cannot be assigned. Use transfer ownership instead.",
    };
  }

  // Check if current user has permission to assign this role
  if (!canAssignRole(currentUserRole, targetRole)) {
    return {
      valid: false,
      error: "You don't have permission to assign this role.",
    };
  }

  return { valid: true };
}

export function getRoleDisplayName(roleId: string): string {
  const role = STANDARD_ROLES.find((r) => r.id === roleId);
  return role?.name || roleId.charAt(0).toUpperCase() + roleId.slice(1);
}

export function getRoleDescription(roleId: string): string {
  const role = STANDARD_ROLES.find((r) => r.id === roleId);
  return role?.description || `${getRoleDisplayName(roleId)} role`;
}

export function isValidRole(roleId: string): boolean {
  return STANDARD_ROLES.some((role) => role.id === roleId);
}

export function getRoleRank(roleId: string): number {
  const role = STANDARD_ROLES.find((r) => r.id === roleId);
  return role?.rank || 999; // Default to lowest priority
}

export function compareRoles(roleA: string, roleB: string): number {
  const rankA = getRoleRank(roleA);
  const rankB = getRoleRank(roleB);
  return rankA - rankB; // Lower rank = higher priority
}

export function canUserModifyRole(
  currentUserRole: string,
  targetUserRole: string,
  newRole: string,
): boolean {
  // Can't modify owner role
  if (isOwnerRole(targetUserRole)) {
    return false;
  }

  // Can't assign owner role
  if (isOwnerRole(newRole)) {
    return false;
  }

  // Owner can modify any non-owner role
  if (isOwnerRole(currentUserRole)) {
    return true;
  }

  // Admin can only modify member roles to member role
  if (currentUserRole.toLowerCase() === "admin") {
    return (
      targetUserRole.toLowerCase() === "member" &&
      newRole.toLowerCase() === "member"
    );
  }

  // Members cannot modify roles
  return false;
}

// Helper for role-based UI rendering
export function getRoleVariant(
  roleId: string,
): "default" | "secondary" | "outline" {
  if (isOwnerRole(roleId)) {
    return "default";
  }
  if (roleId.toLowerCase() === "admin") {
    return "secondary";
  }
  return "outline";
}

// Helper for role icons
export function getRoleIconName(roleId: string): string {
  switch (roleId.toLowerCase()) {
    case "owner":
      return "Crown";
    case "admin":
      return "Shield";
    case "member":
    default:
      return "Users";
  }
}
