"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Clock,
  Trash2,
  Users,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface InvitationManagerProps {
  organizationId?: string;
}

export default function InvitationManager({ organizationId }: InvitationManagerProps) {
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSentInvitations = async () => {
    if (!user?.uid || !organizationId) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations?type=sent&userId=${user.uid}`
      );
      
      if (response.ok) {
        const invitations = await response.json();
        setSentInvitations(invitations);
      }
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    }
  };

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      await fetchSentInvitations();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user, organizationId]);

  const handleCancelInvitation = async (invitation: any) => {
    if (!organizationId) return;

    try {
      setCancellingId(invitation.id);
      
      const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: invitation.id,
        }),
      });

      if (response.ok) {
        setSentInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
        toast({
          title: "Success",
          description: "Invitation cancelled successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel invitation",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setConfirmCancelOpen(false);
      setInvitationToCancel(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24; // Less than 24 hours
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Invitation Management</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInvitations}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {organizationId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Sent Invitations ({sentInvitations.length})</h4>
          </div>
          
          {sentInvitations.length > 0 ? (
            sentInvitations.map((invitation) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{invitation.invitedEmail}</h4>
                      <Badge variant="outline" className="text-xs">
                        {invitation.roleId}
                      </Badge>
                      {isExpiringSoon(invitation.expiresAt) && (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires Soon
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Sent: {formatDate(invitation.createdAt)}</p>
                      <p>Expires: {formatDate(invitation.expiresAt)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInvitationToCancel(invitation);
                      setConfirmCancelOpen(true);
                    }}
                    disabled={cancellingId === invitation.id}
                  >
                    {cancellingId === invitation.id ? (
                      <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Cancel
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>No pending invitations sent</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4" />
          <p>Organization context required to manage invitations</p>
        </div>
      )}

      <ConfirmationDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel Invitation"
        description={`Are you sure you want to cancel the invitation sent to ${invitationToCancel?.invitedEmail}?`}
        confirmText="Cancel Invitation"
        cancelText="Keep Invitation"
        onConfirm={() => invitationToCancel && handleCancelInvitation(invitationToCancel)}
        variant="destructive"
      />
    </div>
  );
}
