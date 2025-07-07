"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";
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
import { InviteRoleSelector } from "@/components/ui/role-selector-optimized";
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

// Global cache with memory cleanup
const rolesCache = new Map<string, { roles: Role[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

// Cleanup old cache entries
const cleanupCache = () => {
  const now = Date.now();
  const entries = Array.from(rolesCache.entries());

  // Remove expired entries
  entries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_DURATION) {
      rolesCache.delete(key);
    }
  });

  // Remove oldest entries if cache is too large
  if (rolesCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, rolesCache.size - MAX_CACHE_SIZE);

    sortedEntries.forEach(([key]) => rolesCache.delete(key));
  }
};

export default function InviteMemberModalOptimized({
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
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Debounced email validation
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Optimized role fetching with deferred execution
  const fetchRoles = useCallback(async () => {
    if (!organizationId) return;

    // Defer heavy operations to prevent UI blocking
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check cache first
    cleanupCache();
    const cached = rolesCache.get(organizationId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setRoles(cached.roles);
        const memberRole = cached.roles.find(
          (r: Role) => r.name.toLowerCase() === "member",
        );
        if (memberRole && !role) {
          setRole(memberRole.id);
        }
      });
      return;
    }

    try {
      setIsLoadingRoles(true);

      // Add small delay to prevent immediate blocking
      await new Promise((resolve) => setTimeout(resolve, 10));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(
        `/api/organizations/${organizationId}/roles`,
        {
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const rolesData = await response.json();

        // Cache the roles
        rolesCache.set(organizationId, {
          roles: rolesData,
          timestamp: now,
        });

        // Use startTransition for state updates
        startTransition(() => {
          setRoles(rolesData);
          const memberRole = rolesData.find(
            (r: Role) => r.name.toLowerCase() === "member",
          );
          if (memberRole && !role) {
            setRole(memberRole.id);
          }
        });
      } else {
        throw new Error("Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);

      // Fallback to basic roles with deferred update
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

      startTransition(() => {
        setRoles(fallbackRoles);
        setRole("member");
      });
    } finally {
      startTransition(() => {
        setIsLoadingRoles(false);
      });
    }
  }, [organizationId, role]);

  // Initialize modal content with deferred loading
  useEffect(() => {
    if (open && organizationId && !isInitialized) {
      // Defer initialization to prevent blocking
      const timeoutId = setTimeout(() => {
        setIsInitialized(true);
        if (roles.length === 0) {
          fetchRoles();
        }
      }, 50); // Small delay to let modal render first

      return () => clearTimeout(timeoutId);
    }
  }, [open, organizationId, isInitialized, roles.length, fetchRoles]);

  // Memoized role description with deferred calculation
  const selectedRoleDescription = useMemo(() => {
    // Defer expensive calculations
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const selectedRole = roles.find((r) => r.id === role);
        if (!selectedRole) {
          resolve("");
          return;
        }

        const roleName = selectedRole.name.toLowerCase();
        switch (roleName) {
          case "member":
            resolve("Can view and participate in assigned projects");
            break;
          case "admin":
            resolve("Can manage projects and invite other members");
            break;
          case "owner":
            resolve("Full access to organization settings and management");
            break;
          default:
            resolve(`Custom role: ${selectedRole.name}`);
        }
      }, 0);
    });
  }, [roles, role]);

  // Use state for resolved description
  const [roleDescription, setRoleDescription] = useState("");

  useEffect(() => {
    selectedRoleDescription.then(setRoleDescription);
  }, [selectedRoleDescription]);

  // Optimized form submission with deferred operations
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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

        // Defer API call slightly to let UI update
        await new Promise((resolve) => setTimeout(resolve, 10));

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
            // Will use default timeout for now
          },
        );

        if (response.ok) {
          // Use startTransition for non-urgent state updates
          startTransition(() => {
            setEmail("");
            setRole("member");
            onOpenChange(false);
          });

          // Defer callback execution
          setTimeout(() => {
            onInvitationSent();
          }, 0);

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
        startTransition(() => {
          setIsInviting(false);
        });
      }
    },
    [
      email,
      role,
      validateEmail,
      organizationId,
      onOpenChange,
      onInvitationSent,
      toast,
    ],
  );

  // Optimized close handler
  const handleClose = useCallback(() => {
    if (!isInviting) {
      startTransition(() => {
        setEmail("");
        setRole("member");
        setEmailError("");
        setIsInitialized(false);
      });
      onOpenChange(false);
    }
  }, [isInviting, onOpenChange]);

  // Optimized email change handler
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEmail = e.target.value;
      setEmail(newEmail);
      if (emailError) {
        // Defer error clearing to prevent blocking
        setTimeout(() => setEmailError(""), 0);
      }
    },
    [emailError],
  );

  // Lazy render modal content only when initialized
  const modalContent = useMemo(() => {
    if (!isInitialized) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    return (
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
              autoComplete="email"
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
            <InviteRoleSelector
              currentRole={role}
              onChange={setRole}
              disabled={isInviting}
              className="w-full"
            />
          )}
          <p className="text-xs text-muted-foreground">{roleDescription}</p>
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
    );
  }, [
    isInitialized,
    email,
    emailError,
    handleEmailChange,
    isInviting,
    isLoadingRoles,
    role,
    roles,
    roleDescription,
    handleSubmit,
    handleClose,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
