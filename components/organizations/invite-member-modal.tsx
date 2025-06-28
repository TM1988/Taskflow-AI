"use client";

import { useState, useEffect } from "react";
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
import { Mail, UserPlus, AlertCircle } from "lucide-react";
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
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  // Fetch available roles when modal opens
  useEffect(() => {
    if (open && organizationId) {
      fetchRoles();
    }
  }, [open, organizationId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/roles`);
      if (response.ok) {
        const rolesData = await response.json();
        setRoles(rolesData);
        // Set default role to member if available
        const memberRole = rolesData.find((r: Role) => r.name.toLowerCase() === 'member');
        if (memberRole) {
          setRole(memberRole.id);
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to basic roles
      setRoles([
        { id: 'member', name: 'Member', rank: 3, permissions: {}, isSystemRole: true },
        { id: 'admin', name: 'Admin', rank: 2, permissions: {}, isSystemRole: true }
      ]);
    }
  };

  const getSelectedRoleDescription = () => {
    const selectedRole = roles.find(r => r.id === role);
    if (!selectedRole) return "";
    
    if (selectedRole.name.toLowerCase() === 'member') {
      return "Can view and participate in assigned projects";
    } else if (selectedRole.name.toLowerCase() === 'admin') {
      return "Can manage projects and invite other members";
    } else if (selectedRole.name.toLowerCase() === 'owner') {
      return "Full access to organization settings and management";
    } else {
      return `Custom role: ${selectedRole.name}`;
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");

    try {
      setIsInviting(true);

      console.log("Sending invitation:", { email: email.trim(), role, organizationId });

      const response = await fetch(`/api/organizations/${organizationId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          roleId: role,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log("Invitation sent successfully:", result);
        
        // Reset form
        setEmail("");
        setRole("member");
        
        // Close modal
        onOpenChange(false);
        
        // Notify parent
        onInvitationSent();

        toast({
          title: "Invitation Sent! 📧",
          description: `An invitation has been sent to ${email}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to Send Invitation",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("member");
    setEmailError("");
    onOpenChange(false);
  };

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                className={`pl-8 ${emailError ? 'border-destructive' : ''}`}
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
            <Select value={role} onValueChange={setRole} disabled={isInviting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((roleOption) => (
                  <SelectItem key={roleOption.id} value={roleOption.id}>
                    {roleOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getSelectedRoleDescription()}
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An email invitation will be sent to this address. The invitation will expire in 7 days.
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
