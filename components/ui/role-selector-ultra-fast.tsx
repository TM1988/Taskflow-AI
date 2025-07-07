"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, Users, Crown, Settings } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  permissions?: string[];
}

interface UltraFastRoleSelectorProps {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: "select" | "dropdown";
  organizationId?: string;
  includeCustomRoles?: boolean;
  context?: "invitation" | "role_change" | "general";
}

// Base system roles - lightweight and always available
const BASE_ROLES: Role[] = [
  {
    id: "member",
    name: "Member",
    description: "Can view and participate in assigned projects",
    isDefault: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Can manage projects and invite other members",
    isDefault: true,
  },
];

// Role icons mapping
const ROLE_ICONS = {
  member: Users,
  admin: Shield,
  owner: Crown,
  custom: Settings,
};

// Role colors mapping
const ROLE_VARIANTS = {
  member: "outline" as const,
  admin: "secondary" as const,
  owner: "default" as const,
  custom: "secondary" as const,
};

// Cache for custom roles to avoid repeated API calls
const customRolesCache = new Map<string, { roles: Role[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function UltraFastRoleSelector({
  currentRole,
  onChange,
  disabled = false,
  className,
  variant = "select",
  organizationId,
  includeCustomRoles = true,
  context = "general",
}: UltraFastRoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [loadingCustomRoles, setLoadingCustomRoles] = useState(false);

  // Fetch custom roles with caching
  const fetchCustomRoles = useCallback(async () => {
    if (!organizationId || !includeCustomRoles) return;

    // Check cache first
    const cached = customRolesCache.get(organizationId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCustomRoles(cached.roles);
      return;
    }

    try {
      setLoadingCustomRoles(true);
      const response = await fetch(`/api/organizations/${organizationId}`);

      if (response.ok) {
        const orgData = await response.json();
        const roles = orgData.customRoles || [];

        // Cache the result
        customRolesCache.set(organizationId, {
          roles,
          timestamp: Date.now(),
        });

        setCustomRoles(roles);
      }
    } catch (error) {
      console.error("Error fetching custom roles:", error);
      setCustomRoles([]);
    } finally {
      setLoadingCustomRoles(false);
    }
  }, [organizationId, includeCustomRoles]);

  // Load custom roles on mount and when organizationId changes
  useEffect(() => {
    fetchCustomRoles();
  }, [fetchCustomRoles]);

  // Combined roles list with memoization for performance
  const availableRoles = useMemo(() => {
    const roles = [...BASE_ROLES];

    if (includeCustomRoles && customRoles.length > 0) {
      // Filter and add custom roles
      const validCustomRoles = customRoles.filter(role =>
        role && role.id && role.name && role.id !== 'owner'
      );
      roles.push(...validCustomRoles);
    }

    // Filter based on context
    if (context === "invitation") {
      // For invitations, exclude owner role
      return roles.filter(role => role.id !== "owner");
    }

    return roles;
  }, [customRoles, includeCustomRoles, context]);

  // Find current role info with fallback
  const currentRoleInfo = useMemo(() => {
    const found = availableRoles.find(role => role.id === currentRole);
    if (found) return found;

    // Fallback for unknown roles (might be custom roles not yet loaded)
    return {
      id: currentRole,
      name: currentRole.charAt(0).toUpperCase() + currentRole.slice(1),
      description: `${currentRole} role`,
      isDefault: false,
    };
  }, [availableRoles, currentRole]);

  // Handle role change with immediate execution
  const handleRoleChange = useCallback((roleId: string) => {
    if (roleId !== currentRole && !disabled) {
      onChange(roleId);
    }
    setIsOpen(false);
  }, [currentRole, disabled, onChange]);

  // Get role icon efficiently
  const getRoleIcon = useCallback((roleId: string) => {
    if (ROLE_ICONS[roleId as keyof typeof ROLE_ICONS]) {
      return ROLE_ICONS[roleId as keyof typeof ROLE_ICONS];
    }
    // Check if it's a custom role
    const isCustom = customRoles.some(role => role.id === roleId);
    return isCustom ? ROLE_ICONS.custom : ROLE_ICONS.member;
  }, [customRoles]);

  // Render role badge with icon
  const renderRoleBadge = useCallback((role: Role, showIcon = false) => {
    const IconComponent = getRoleIcon(role.id);
    let variant = ROLE_VARIANTS[role.id as keyof typeof ROLE_VARIANTS];

    // If not a standard role, check if it's custom
    if (!variant) {
      const isCustom = !role.isDefault && customRoles.some(r => r.id === role.id);
      variant = isCustom ? ROLE_VARIANTS.custom : ROLE_VARIANTS.member;
    }

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {showIcon && <IconComponent className="h-3 w-3" />}
        {role.name}
        {!role.isDefault && (
          <span className="text-xs opacity-75">(Custom)</span>
        )}
      </Badge>
    );
  }, [getRoleIcon, customRoles]);

  // Select variant - more performant for forms
  if (variant === "select") {
    return (
      <div className={className}>
        <Select
          value={currentRole}
          onValueChange={handleRoleChange}
          disabled={disabled || loadingCustomRoles}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                {renderRoleBadge(currentRoleInfo, true)}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {loadingCustomRoles && (
              <SelectItem value="loading" disabled>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm">Loading roles...</span>
                </div>
              </SelectItem>
            )}

            {/* Base roles first */}
            {availableRoles
              .filter(role => role.isDefault)
              .map((role) => (
                <SelectItem
                  key={role.id}
                  value={role.id}
                  disabled={role.id === currentRole}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {renderRoleBadge(role, true)}
                    </div>
                    <div className="text-xs text-muted-foreground ml-2 max-w-48 truncate">
                      {role.description}
                    </div>
                  </div>
                </SelectItem>
              ))}

            {/* Custom roles with separator */}
            {availableRoles.filter(role => !role.isDefault).length > 0 && (
              <>
                <div className="px-2 py-1">
                  <div className="border-t border-border"></div>
                  <div className="text-xs text-muted-foreground mt-1">Custom Roles</div>
                </div>
                {availableRoles
                  .filter(role => !role.isDefault)
                  .map((role) => (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                      disabled={role.id === currentRole}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {renderRoleBadge(role, true)}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2 max-w-48 truncate">
                          {role.description || "Custom role"}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Dropdown variant - better for inline actions
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loadingCustomRoles}
          className={`${className} flex items-center gap-2`}
        >
          {renderRoleBadge(currentRoleInfo)}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {loadingCustomRoles && (
          <DropdownMenuItem disabled className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading roles...</span>
            </div>
          </DropdownMenuItem>
        )}

        {/* Base roles */}
        {availableRoles
          .filter(role => role.isDefault)
          .map((role) => (
            <DropdownMenuItem
              key={role.id}
              onClick={() => handleRoleChange(role.id)}
              disabled={role.id === currentRole || disabled}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {renderRoleBadge(role, true)}
              </div>
              <div className="text-xs text-muted-foreground ml-2 max-w-32 truncate">
                {role.description}
              </div>
            </DropdownMenuItem>
          ))}

        {/* Custom roles with separator */}
        {availableRoles.filter(role => !role.isDefault).length > 0 && (
          <>
            <div className="px-2 py-1">
              <div className="border-t border-border"></div>
              <div className="text-xs text-muted-foreground mt-1">Custom Roles</div>
            </div>
            {availableRoles
              .filter(role => !role.isDefault)
              .map((role) => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  disabled={role.id === currentRole || disabled}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {renderRoleBadge(role, true)}
                  </div>
                  <div className="text-xs text-muted-foreground ml-2 max-w-32 truncate">
                    {role.description || "Custom role"}
                  </div>
                </DropdownMenuItem>
              ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Convenience component for organization member role changes
export function MemberRoleSelectorUltraFast({
  currentRole,
  onChange,
  disabled = false,
  className,
  organizationId,
}: {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
}) {
  return (
    <UltraFastRoleSelector
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      variant="dropdown"
      organizationId={organizationId}
      includeCustomRoles={true}
      context="role_change"
    />
  );
}

// Convenience component for invitation role selection
export function InviteRoleSelectorUltraFast({
  currentRole,
  onChange,
  disabled = false,
  className,
  organizationId,
}: {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
}) {
  return (
    <UltraFastRoleSelector
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      variant="select"
      organizationId={organizationId}
      includeCustomRoles={true}
      context="invitation"
    />
  );
}

// Function to clear cache when custom roles are updated
export function clearCustomRolesCache(organizationId?: string) {
  if (organizationId) {
    customRolesCache.delete(organizationId);
  } else {
    customRolesCache.clear();
  }
}
