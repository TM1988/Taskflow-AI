"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Shield
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const [invitation, setInvitation] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching invitation for token: ${params.token}`);

        // Fetch invitation by token
        const response = await fetch(`/api/invitations/token/${params.token}`);
        
        if (response.ok) {
          const invitationData = await response.json();
          console.log("Invitation data:", invitationData);
          
          setInvitation(invitationData);

          // Fetch organization details
          const orgResponse = await fetch(`/api/organizations/${invitationData.organizationId}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            setOrganization(orgData);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Invitation not found or expired");
        }
      } catch (error) {
        console.error("Error fetching invitation:", error);
        setError("Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      fetchInvitation();
    }
  }, [params.token]); // Remove user dependency to prevent auto-decline

  const handleAccept = async () => {
    if (!invitation || !user) {
      if (!user) {
        // Redirect to login with return URL
        router.push(`/auth/login?returnTo=/invite/${params.token}`);
        return;
      }
      return;
    }

    // Check if current user email matches the invited email
    if (user.email !== invitation.invitedEmail) {
      toast({
        title: "Wrong Account",
        description: `This invitation was sent to ${invitation.invitedEmail}. Please sign in with the correct account.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setAccepting(true);
      
      const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(true);
        
        toast({
          title: "Success!",
          description: `You've joined ${organization?.name || 'the organization'}`,
        });

        // Redirect to organization page after a delay
        setTimeout(() => {
          router.push(`/organizations/${result.organizationId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !user) return;

    try {
      setDeclining(true);
      
      const response = await fetch(`/api/invitations/${invitation.id}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (response.ok) {
        toast({
          title: "Invitation declined",
          description: "You have declined the invitation",
        });
        
        router.push("/");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline invitation");
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setDeclining(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Unknown";
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => router.push("/")}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Welcome to the team!</CardTitle>
            <CardDescription>
              You&apos;ve successfully joined {organization?.name}. Redirecting you to the organization...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invitation || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              This invitation may have expired or been revoked.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const expired = isExpired(invitation.expiresAt);
  const expiringSoon = isExpiringSoon(invitation.expiresAt);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
          <CardDescription>
            Join {organization?.name || 'the organization'} on TaskFlow and start collaborating
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {organization.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{organization.name}</h3>
                {organization.description && (
                  <p className="text-sm text-muted-foreground">{organization.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{organization.memberCount || 1} members</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{invitation.roleId}</span>
              </div>
            </div>
          </div>

          {/* Expiration Warning */}
          {expired ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation expired on {formatDate(invitation.expiresAt)}.
              </AlertDescription>
            </Alert>
          ) : expiringSoon ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This invitation expires on {formatDate(invitation.expiresAt)}.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Valid until {formatDate(invitation.expiresAt)}
            </div>
          )}

          {/* User Status */}
          {!user ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in to accept this invitation.
              </AlertDescription>
            </Alert>
          ) : user.email !== invitation.invitedEmail ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitation.invitedEmail}. 
                You are currently signed in as {user.email}. 
                Please sign in with the correct account.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Signed in as {user.email} ✓
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!expired && user?.email === invitation.invitedEmail && (
              <Button 
                className="w-full text-white" 
                onClick={handleAccept}
                disabled={accepting || declining}
              >
                {accepting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            )}
            
            {/* Only show decline if correct user or if expired */}
            {(expired || (user?.email === invitation.invitedEmail)) && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={expired ? () => router.push("/") : handleDecline}
                disabled={accepting || declining}
              >
                {expired ? (
                  "Go to Dashboard"
                ) : declining ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Declining...
                  </>
                ) : (
                  "Decline Invitation"
                )}
              </Button>
            )}

            {/* Close button for wrong account */}
            {!expired && user && user.email !== invitation.invitedEmail && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.close()}
              >
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
