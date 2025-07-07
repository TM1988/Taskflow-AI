"use client";

import { useState, useCallback, useMemo } from "react";
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
import { ChevronDown, Shield, Users, Crown } from "lucide-react";
import {
  Role,
  STANDARD_ROLES,
  filterRolesForInvitation,
  filterRolesForRoleChange,
  getRoleDisplayName,
  getRoleDescription,
  getRoleVariant,
  isOwnerRole,
} from "@/utils/role-utils";

interface RoleSelectorProps {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: "select" | "dropdown";
  availableRoles?: Role[];
  excludeOwner?: boolean;
  currentUserRole?: string; // For permission checking
  context?: "invitation" | "role_change" | "general";
}

// Role icons mapping
const ROLE_ICONS = {
  member: Users,
  admin: Shield,
  owner: Crown,
};

// Role colors mapping
const ROLE_VARIANTS = {
  member: "outline" as const,
  admin: "secondary" as const,
  owner: "default" as const,
};

export function RoleSelectorOptimized({
  currentRole,
  onChange,
  disabled = false,
  className,
  variant = "select",
  availableRoles,
  excludeOwner = true,
  currentUserRole = "admin",
  context = "general",
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized roles list with proper filtering
  const roles = useMemo(() => {
    const baseRoles = availableRoles || STANDARD_ROLES;

    // Always filter out owner role for safety
    let filteredRoles = baseRoles.filter((role) => !isOwnerRole(role));

    // Apply context-specific filtering
    if (context === "invitation") {
      filteredRoles = filterRolesForInvitation(filteredRoles);
    } else if (context === "role_change") {
      filteredRoles = filterRolesForRoleChange(filteredRoles, currentUserRole);
    }

    return filteredRoles;
  }, [availableRoles, excludeOwner, currentUserRole, context]);

  // Find current role info with fallback
  const currentRoleInfo = useMemo(() => {
    const found = roles.find((role) => role.id === currentRole);
    if (found) return found;

    // Fallback for current role
    return {
      id: currentRole,
      name: getRoleDisplayName(currentRole),
      description: getRoleDescription(currentRole),
    };
  }, [roles, currentRole]);

  // Handle role change with validation and deferred execution
  const handleRoleChange = useCallback(
    (roleId: string) => {
      // Prevent owner role selection
      if (isOwnerRole(roleId)) {
        console.warn("Owner role cannot be assigned through role selector");
        return;
      }

      if (roleId !== currentRole && !disabled) {
        setIsLoading(true);
        // Defer the onChange call to prevent UI blocking
        setTimeout(() => {
          onChange(roleId);
          setIsLoading(false);
        }, 0);
      }
      setIsOpen(false);
    },
    [currentRole, disabled, onChange],
  );

  // Get role icon
  const getRoleIcon = useCallback((roleId: string) => {
    const IconComponent =
      ROLE_ICONS[roleId as keyof typeof ROLE_ICONS] || Users;
    return IconComponent;
  }, []);

  // Render role badge
  const renderRoleBadge = useCallback(
    (role: Role, showIcon = false) => {
      const IconComponent = getRoleIcon(role.id);
      const variant = getRoleVariant(role.id);

      return (
        <Badge variant={variant} className="flex items-center gap-1">
          {showIcon && <IconComponent className="h-3 w-3" />}
          {role.name}
        </Badge>
      );
    },
    [getRoleIcon],
  );

  // Select variant
  if (variant === "select") {
    return (
      <div className={className}>
        <Select
          value={currentRole}
          onValueChange={handleRoleChange}
          disabled={disabled || isLoading}
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
            {isLoading ? (
              <SelectItem value="loading" disabled>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Updating...</span>
                </div>
              </SelectItem>
            ) : (
              roles.map((role) => (
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
                      {role.description || getRoleDescription(role.id)}
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Dropdown variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          className={`${className} flex items-center gap-2`}
        >
          {renderRoleBadge(currentRoleInfo)}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {isLoading ? (
          <DropdownMenuItem
            disabled
            className="flex items-center justify-center"
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Updating...</span>
            </div>
          </DropdownMenuItem>
        ) : (
          roles.map((role) => (
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
                {role.description || getRoleDescription(role.id)}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Convenience component for organization member role changes
export function MemberRoleSelector({
  currentRole,
  onChange,
  disabled = false,
  className,
  showCurrentUser = false,
}: {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  showCurrentUser?: boolean;
}) {
  return (
    <RoleSelectorOptimized
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      variant="dropdown"
      excludeOwner={true}
      context="role_change"
      currentUserRole="owner" // Assume organization owner for role changes
    />
  );
}

// Convenience component for invitation role selection
export function InviteRoleSelector({
  currentRole,
  onChange,
  disabled = false,
  className,
}: {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RoleSelectorOptimized
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      variant="select"
      excludeOwner={true}
      context="invitation"
      currentUserRole="owner" // Assume organization owner for invitations
    />
  );
}
