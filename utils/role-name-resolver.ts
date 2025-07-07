"use client";

interface Role {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface Organization {
  customRoles?: Role[];
  memberRoles?: Record<string, string>;
}

// Standard role mappings
const STANDARD_ROLES: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

/**
 * Resolves a role ID to its display name using organization data
 */
export function resolveRoleName(
  roleId: string,
  organization?: Organization
): string {
  if (!roleId) return "Member";

  // Check standard roles first
  if (STANDARD_ROLES[roleId]) {
    return STANDARD_ROLES[roleId];
  }

  // Check custom roles in organization
  if (organization?.customRoles) {
    const customRole = organization.customRoles.find(role => role.id === roleId);
    if (customRole?.name) {
      return customRole.name;
    }
  }

  // Fallback: format the role ID nicely
  if (roleId.startsWith("custom_")) {
    return "Custom Role";
  }

  // Final fallback: capitalize the role ID
  return roleId.charAt(0).toUpperCase() + roleId.slice(1);
}

/**
 * Gets member role information including resolved name
 */
export function getMemberRoleInfo(
  memberId: string,
  organization: Organization & { ownerId?: string }
) {
  const isOwner = memberId === organization.ownerId;

  if (isOwner) {
    return {
      roleId: "owner",
      roleName: "Owner",
      isOwner: true,
    };
  }

  const roleId = organization.memberRoles?.[memberId] || "member";
  const roleName = resolveRoleName(roleId, organization);

  return {
    roleId,
    roleName,
    isOwner: false,
  };
}

/**
 * Cache for role names to avoid repeated lookups
 */
const roleNameCache = new Map<string, string>();

/**
 * Cached version of role name resolution
 */
export function resolveRoleNameCached(
  roleId: string,
  organization?: Organization
): string {
  const cacheKey = `${roleId}-${organization?.customRoles?.length || 0}`;

  if (roleNameCache.has(cacheKey)) {
    return roleNameCache.get(cacheKey)!;
  }

  const roleName = resolveRoleName(roleId, organization);
  roleNameCache.set(cacheKey, roleName);

  return roleName;
}

/**
 * Clear the role name cache
 */
export function clearRoleNameCache() {
  roleNameCache.clear();
}

/**
 * Get role variant for UI styling
 */
export function getRoleVariant(roleId: string): "default" | "secondary" | "outline" {
  switch (roleId) {
    case "owner":
      return "default";
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Check if a role is a custom role
 */
export function isCustomRole(roleId: string): boolean {
  return roleId.startsWith("custom_") || !STANDARD_ROLES[roleId];
}
