"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { Users, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

function JoinOrganizationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  
  const [invitation, setInvitation] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizations/invitations/${token}`);
        
        if (response.ok) {
          const invitationData = await response.json();
          setInvitation(invitationData);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Invalid or expired invitation");
        }
      } catch (error) {
        console.error("Error fetching invitation:", error);
        setError("Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleJoinOrganization = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join this organization",
        variant: "destructive",
      });
      return;
    }

    if (invitation.organization.hasPassword && !password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the organization password",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoining(true);
      
      const response = await fetch(`/api/organizations/invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: invitation.organization.hasPassword ? password : undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Welcome to ${invitation.organization.name}!`,
        });
        
        // Redirect to organization or dashboard
        router.push(`/organizations/${invitation.organization.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join organization");
      }
    } catch (error) {
      console.error("Error joining organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join organization",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleDeclineInvitation = async () => {
    try {
      const response = await fetch(`/api/organizations/invitations/${token}/decline`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Invitation Declined",
          description: "You have declined the invitation",
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This invitation link is invalid or has expired."}
          </p>
          <Button onClick={() => router.push("/")} className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Check if user is already a member
  if (invitation.isAlreadyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Already a Member</h1>
          <p className="text-muted-foreground mb-6">
            You are already a member of {invitation.organization.name}.
          </p>
          <Button 
            onClick={() => router.push(`/organizations/${invitation.organization.id}`)} 
            className="w-full"
          >
            Go to Organization
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Join Organization</h1>
          <p className="text-muted-foreground">
            You&apos;ve been invited to join an organization
          </p>
        </div>

        <div className="space-y-6">
          {/* Organization Info */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {invitation.organization.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{invitation.organization.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {invitation.organization.memberCount} members
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">You will join as:</span>
              <Badge variant="outline">{invitation.role.name}</Badge>
            </div>
          </div>

          {/* Inviter Info */}
          <div className="text-center text-sm text-muted-foreground">
            Invited by <span className="font-medium">{invitation.inviter.name}</span>
          </div>

          {/* Password Input (if required) */}
          {invitation.organization.hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="orgPassword">Organization Password</Label>
              <Input
                id="orgPassword"
                type="password"
                placeholder="Enter organization password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                This organization requires a password to join
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDeclineInvitation}
              className="flex-1"
              disabled={joining}
            >
              Decline
            </Button>
            <Button
              onClick={handleJoinOrganization}
              className="flex-1"
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Organization"
              )}
            </Button>
          </div>

          {/* Terms Notice */}
          <p className="text-xs text-center text-muted-foreground">
            By joining this organization, you agree to follow their policies and guidelines.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function JoinOrganizationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invitation...</span>
        </div>
      </div>
    }>
      <JoinOrganizationContent />
    </Suspense>
  );
}
