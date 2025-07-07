"use client";

import { useState, useCallback } from "react";
import {
  DialogFast,
  DialogContentFast,
  DialogHeaderFast,
  DialogTitleFast,
  DialogFooterFast,
} from "@/components/ui/dialog-fast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, UserPlus, AlertCircle } from "lucide-react";
import { InviteRoleSelectorOptimizedExtreme } from "@/components/ui/role-selector-optimized-extreme";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InviteMemberModalFastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onInvitationSent: () => void;
}

export default function InviteMemberModalFast({
  open,
  onOpenChange,
  organizationId,
  onInvitationSent,
}: InviteMemberModalFastProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  // Simple email validation
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Fast form submission - no deferring, immediate execution
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
          onOpenChange(false);
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

  // Fast close handler
  const handleClose = useCallback(() => {
    if (!isInviting) {
      setEmail("");
      setRole("member");
      setEmailError("");
      onOpenChange(false);
    }
  }, [isInviting, onOpenChange]);

  // Fast email change handler
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
    <DialogFast open={open} onOpenChange={handleClose}>
      <DialogContentFast className="sm:max-w-md">
        <DialogHeaderFast>
          <DialogTitleFast className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitleFast>
        </DialogHeaderFast>

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
            <InviteRoleSelectorOptimizedExtreme
              currentRole={role}
              onChange={setRole}
              disabled={isInviting}
              className="w-full"
              organizationId={organizationId}
            />
            <p className="text-xs text-muted-foreground">
              {role === "admin"
                ? "Can manage projects and invite other members"
                : role.startsWith("custom_")
                  ? "Custom role with specific permissions"
                  : "Can view and participate in assigned projects"}
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An email invitation will be sent to this address. The invitation
              will expire in 7 days.
            </AlertDescription>
          </Alert>

          <DialogFooterFast>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting || !email.trim()}>
              {isInviting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooterFast>
        </form>
      </DialogContentFast>
    </DialogFast>
  );
}
