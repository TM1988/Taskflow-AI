"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Role {
  id: string;
  name: string;
  rank: number;
  permissions: any;
  isSystemRole: boolean;
}

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onInvitationSent: () => void;
}

// Cache roles to prevent refetching on every modal open
const rolesCache = new Map<string, { roles: Role[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function InviteMemberModal({
  open,
  onOpenChange,
  organizationId,
  onInvitationSent,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  // Optimized role fetching with caching
  const fetchRoles = useCallback(async () => {
    if (!organizationId) return;

    // Check cache first
    const cached = rolesCache.get(organizationId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setRoles(cached.roles);
      // Set default role to member if available
      const memberRole = cached.roles.find(
        (r: Role) => r.name.toLowerCase() === "member",
      );
      if (memberRole && !role) {
        setRole(memberRole.id);
      }
      return;
    }

    try {
      setIsLoadingRoles(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/roles`,
      );

      if (response.ok) {
        const rolesData = await response.json();

        // Cache the roles
        rolesCache.set(organizationId, {
          roles: rolesData,
          timestamp: now,
        });

        // Filter out owner role and set roles
        const filteredRoles = rolesData.filter(
          (r: Role) => r.name.toLowerCase() !== "owner",
        );
        setRoles(filteredRoles);

        // Set default role to member if available
        const memberRole = filteredRoles.find(
          (r: Role) => r.name.toLowerCase() === "member",
        );
        if (memberRole && !role) {
          setRole(memberRole.id);
        }
      } else {
        throw new Error("Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      // Fallback to basic roles (excluding owner)
      const fallbackRoles = [
        {
          id: "member",
          name: "Member",
          rank: 3,
          permissions: {},
          isSystemRole: true,
        },
        {
          id: "admin",
          name: "Admin",
          rank: 2,
          permissions: {},
          isSystemRole: true,
        },
      ];
      setRoles(fallbackRoles);
      setRole("member");
    } finally {
      setIsLoadingRoles(false);
    }
  }, [organizationId, role]);

  // Only fetch roles when modal opens and we don't have them cached
  useEffect(() => {
    if (open && organizationId && roles.length === 0) {
      // Small delay to prevent immediate blocking
      setTimeout(() => {
        fetchRoles();
      }, 50);
    }
  }, [open, organizationId, roles.length, fetchRoles]);

  // Memoized role description to prevent recalculations
  const selectedRoleDescription = useMemo(() => {
    const selectedRole = roles.find((r) => r.id === role);
    if (!selectedRole) return "";

    const roleName = selectedRole.name.toLowerCase();
    switch (roleName) {
      case "member":
        return "Can view and participate in assigned projects";
      case "admin":
        return "Can manage projects and invite other members";
      default:
        return `Custom role: ${selectedRole.name}`;
    }
  }, [roles, role]);

  // Optimized email validation
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");

    try {
      setIsInviting(true);

      const response = await fetch(
        `/api/organizations/${organizationId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            roleId: role,
          }),
        },
      );

      if (response.ok) {
        // Reset form
        setEmail("");
        setRole("member");

        // Close modal
        onOpenChange(false);

        // Notify parent
        onInvitationSent();

        toast({
          title: "Invitation Sent! 📧",
          description: `An invitation has been sent to ${trimmedEmail}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to Send Invitation",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isInviting) {
      setEmail("");
      setRole("member");
      setEmailError("");
      onOpenChange(false);
    }
  }, [isInviting, onOpenChange]);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (emailError) {
        setEmailError("");
      }
    },
    [emailError],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={handleEmailChange}
                className={`pl-8 ${emailError ? "border-destructive" : ""}`}
                disabled={isInviting}
                required
              />
            </div>
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            {isLoadingRoles ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading roles...
                </span>
              </div>
            ) : (
              <Select
                value={role}
                onValueChange={setRole}
                disabled={isInviting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter(
                      (roleOption) => roleOption.name.toLowerCase() !== "owner",
                    )
                    .map((roleOption) => (
                      <SelectItem key={roleOption.id} value={roleOption.id}>
                        {roleOption.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedRoleDescription}
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An email invitation will be sent to this address. The invitation
              will expire in 7 days.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isInviting || !email.trim() || isLoadingRoles}
            >
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
