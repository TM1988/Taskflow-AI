"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface LightningRoleSelectorProps {
  currentRole: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
  variant?: "native" | "minimal";
}

// Base roles - no complex objects
const BASE_ROLES = [
  { id: "member", name: "Member", isDefault: true },
  { id: "admin", name: "Admin", isDefault: true },
];

// Simple cache - just role arrays, no timestamps
const rolesCache = new Map<string, Role[]>();

export function LightningRoleSelector({
  currentRole,
  onChange,
  disabled = false,
  className = "",
  organizationId,
  variant = "native",
}: LightningRoleSelectorProps) {
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load custom roles once
  useEffect(() => {
    if (!organizationId) return;

    const cached = rolesCache.get(organizationId);
    if (cached) {
      setCustomRoles(cached);
      return;
    }

    setIsLoading(true);
    fetch(`/api/organizations/${organizationId}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const roles = data.customRoles || [];
        rolesCache.set(organizationId, roles);
        setCustomRoles(roles);
      })
      .catch(() => setCustomRoles([]))
      .finally(() => setIsLoading(false));
  }, [organizationId]);

  // Simple role list - no complex filtering
  const allRoles = useMemo(() => {
    return [...BASE_ROLES, ...customRoles];
  }, [customRoles]);

  // Find current role name - simple lookup
  const currentRoleName = useMemo(() => {
    const role = allRoles.find(r => r.id === currentRole);
    return role?.name || currentRole;
  }, [allRoles, currentRole]);

  // Simple change handler
  const handleChange = useCallback((value: string) => {
    if (value !== currentRole && !disabled) {
      onChange(value);
    }
  }, [currentRole, disabled, onChange]);

  // Native select - fastest option
  if (variant === "native") {
    return (
      <select
        value={currentRole}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled || isLoading}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          bg-white text-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isLoading && <option value="">Loading...</option>}

        {BASE_ROLES.map(role => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}

        {customRoles.length > 0 && (
          <optgroup label="Custom Roles">
            {customRoles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    );
  }

  // Minimal custom dropdown - no hover effects, minimal DOM
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && document.getElementById(`roles-${organizationId || 'default'}`)?.click()}
        disabled={disabled || isLoading}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md bg-white
          text-left text-sm flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `}
      >
        <span className="truncate">
          {isLoading ? "Loading..." : currentRoleName}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </button>

      <select
        id={`roles-${organizationId || 'default'}`}
        value={currentRole}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled || isLoading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ pointerEvents: disabled || isLoading ? 'none' : 'auto' }}
      >
        {BASE_ROLES.map(role => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}

        {customRoles.length > 0 && (
          <optgroup label="Custom Roles">
            {customRoles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

// Lightning fast member selector
export function MemberRoleSelectorLightning({
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
    <LightningRoleSelector
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      organizationId={organizationId}
      variant="native"
    />
  );
}

// Lightning fast invite selector
export function InviteRoleSelectorLightning({
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
    <LightningRoleSelector
      currentRole={currentRole}
      onChange={onChange}
      disabled={disabled}
      className={className}
      organizationId={organizationId}
      variant="native"
    />
  );
}

// Clear cache function
export function clearRolesCache(organizationId?: string) {
  if (organizationId) {
    rolesCache.delete(organizationId);
  } else {
    rolesCache.clear();
  }
}
