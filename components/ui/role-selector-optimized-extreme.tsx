"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Shield, Users, Crown, Settings } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface OptimizedExtremeRoleSelectorProps {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
  variant?: "dropdown" | "select";
}

// Base roles - pre-computed
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

// Pre-computed icon map - no dynamic lookups
const ROLE_ICONS = {
  member: Users,
  admin: Shield,
  owner: Crown,
} as const;

// Simple cache
const rolesCache = new Map<string, Role[]>();

export function OptimizedExtremeRoleSelector({
  currentRole,
  onChange,
  disabled = false,
  className = "",
  organizationId,
  variant = "dropdown",
}: OptimizedExtremeRoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load custom roles once, no loading states
  useEffect(() => {
    if (!organizationId) return;

    const cached = rolesCache.get(organizationId);
    if (cached) {
      setCustomRoles(cached);
      return;
    }

    // Fire and forget - no loading UI
    fetch(`/api/organizations/${organizationId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const roles = (data.customRoles || []).map((role: any) => ({
          id: role.id,
          name: role.name || "Custom Role",
          description: role.description || "Custom role",
          isDefault: false,
        }));
        rolesCache.set(organizationId, roles);
        setCustomRoles(roles);
      })
      .catch(() => {
        rolesCache.set(organizationId, []);
      });
  }, [organizationId]);

  // Pre-compute all roles - no dynamic filtering
  const allRoles = useMemo(
    () => [...BASE_ROLES, ...customRoles],
    [customRoles],
  );

  // Pre-compute current role info with better fallback for custom roles
  const currentRoleInfo = useMemo(() => {
    const foundRole = allRoles.find((r) => r.id === currentRole);
    if (foundRole) {
      return foundRole;
    }

    // Better fallback for custom roles that might not be loaded yet
    if (currentRole.startsWith("custom_")) {
      // Try to extract a more readable name from custom role ID
      const roleNameFromId = currentRole
        .replace("custom_", "")
        .replace(/^\d+$/, "Custom Role");
      return {
        id: currentRole,
        name: roleNameFromId.charAt(0).toUpperCase() + roleNameFromId.slice(1),
        description: "Custom role (loading...)",
        isDefault: false,
      };
    }

    // Standard fallback
    return {
      id: currentRole,
      name: currentRole.charAt(0).toUpperCase() + currentRole.slice(1),
      description: "",
      isDefault: false,
    };
  }, [allRoles, currentRole]);

  // Optimized change handler - minimal logic
  const handleRoleChange = useCallback(
    (roleId: string) => {
      if (roleId !== currentRole && !disabled) {
        onChange(roleId);
      }
      setIsOpen(false);
    },
    [currentRole, disabled, onChange],
  );

  // Optimized click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Immediate listener, remove on close
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Get role icon - pre-computed lookup
  const getRoleIcon = useCallback((roleId: string) => {
    return ROLE_ICONS[roleId as keyof typeof ROLE_ICONS] || Settings;
  }, []);

  // Optimized badge rendering - minimal DOM
  const renderRoleBadge = useCallback(
    (role: Role) => {
      const Icon = getRoleIcon(role.id);
      const isCustom = !role.isDefault;

      return (
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium">{role.name}</span>
          {isCustom && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (Custom)
            </span>
          )}
        </div>
      );
    },
    [getRoleIcon],
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button - minimal styling for performance */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md
          shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed
          text-gray-900 dark:text-gray-100 transition-none
        `}
        style={{ minHeight: "38px" }}
      >
        <div className="flex items-center justify-between">
          {renderRoleBadge(currentRoleInfo)}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-75 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu - only render when open */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
          style={{
            minWidth: buttonRef.current?.offsetWidth || 200,
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {/* Default Roles */}
          {BASE_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleChange(role.id)}
              disabled={role.id === currentRole}
              className={`
                w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900
                focus:outline-none transition-colors duration-75
                disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                border-none bg-transparent text-gray-900 dark:text-gray-100
              `}
            >
              <div className="flex items-center justify-between">
                {renderRoleBadge(role)}
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 max-w-32 truncate">
                  {role.description}
                </span>
              </div>
            </button>
          ))}

          {/* Custom Roles Separator */}
          {customRoles.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                Custom Roles
              </div>
              {customRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  disabled={role.id === currentRole}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900
                    focus:outline-none transition-colors duration-75
                    disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    border-none bg-transparent text-gray-900 dark:text-gray-100
                  `}
                >
                  <div className="flex items-center justify-between">
                    {renderRoleBadge(role)}
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 max-w-32 truncate">
                      {role.description || "Custom role"}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Member role selector
export function MemberRoleSelectorOptimizedExtreme({
  currentRole,
  onChange,
  disabled = false,
  className = "",
  organizationId,
}: {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
}) {
  return (
    <OptimizedExtremeRoleSelector
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      organizationId={organizationId}
      variant="dropdown"
    />
  );
}

// Invite role selector
export function InviteRoleSelectorOptimizedExtreme({
  currentRole,
  onChange,
  disabled = false,
  className = "",
  organizationId,
}: {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
}) {
  return (
    <OptimizedExtremeRoleSelector
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      organizationId={organizationId}
      variant="select"
    />
  );
}

// Clear cache
export function clearExtremeRolesCache(organizationId?: string) {
  if (organizationId) {
    rolesCache.delete(organizationId);
  } else {
    rolesCache.clear();
  }
}
