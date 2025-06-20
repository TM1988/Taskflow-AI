"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Key, 
  UserX, 
  Crown,
  AlertTriangle,
  Lock,
  Users,
  Eye,
  EyeOff
} from "lucide-react";

interface SecurityTabProps {
  organizationId: string;
  isOwner: boolean;
  currentUser: any;
  members: any[];
  onOwnershipTransferred: () => void;
}

export default function SecurityTab({ 
  organizationId, 
  isOwner, 
  currentUser,
  members,
  onOwnershipTransferred 
}: SecurityTabProps) {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState("");
  const [transferring, setTransferring] = useState(false);
  
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [orgPassword, setOrgPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const { toast } = useToast();

  const eligibleMembers = members.filter(
    member => member.id !== currentUser?.uid && member.role !== "viewer"
  );

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner || confirmTransfer !== "TRANSFER") {
      toast({
        title: "Error",
        description: "Please select a new owner and type TRANSFER to confirm",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransferring(true);
      
      const response = await fetch(`/api/organizations/${organizationId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newOwnerId: selectedNewOwner,
        }),
      });

      if (response.ok) {
        toast({
          title: "Ownership Transferred",
          description: "Organization ownership has been successfully transferred",
        });
        setTransferModalOpen(false);
        onOwnershipTransferred();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to transfer ownership");
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!orgPassword || orgPassword !== confirmPassword) {
      toast({
        title: "Error", 
        description: "Please enter a valid password and confirm it",
        variant: "destructive",
      });
      return;
    }

    if (orgPassword.length < 8) {
      toast({
        title: "Error",
        description: "Organization password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingPassword(true);
      
      const response = await fetch(`/api/organizations/${organizationId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: orgPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Organization password updated successfully",
        });
        setPasswordModalOpen(false);
        setOrgPassword("");
        setConfirmPassword("");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Only organization owners can access security settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Organization Password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set a password for sensitive organization operations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Organization Access Password</h4>
              <p className="text-sm text-muted-foreground">
                Required for member management and critical changes
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setPasswordModalOpen(true)}
            >
              Update Password
            </Button>
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              This password will be required for sensitive operations like removing members 
              or transferring ownership.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Ownership Transfer */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Crown className="h-5 w-5" />
            Transfer Ownership
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Transfer organization ownership to another member
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Warning:</strong> This action cannot be undone. You will lose owner privileges 
              and become a regular admin member.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Current Owner</h4>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.displayName || currentUser?.email}
                </p>
                <Badge variant="default" className="mt-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Owner
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Eligible Members ({eligibleMembers.length})</Label>
              <div className="text-sm text-muted-foreground">
                Only admins and members can become owners. Viewers are not eligible.
              </div>
              {eligibleMembers.length === 0 ? (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    No eligible members found. Invite admin or member-level users to transfer ownership.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {eligibleMembers.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <h5 className="font-medium">{member.name}</h5>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedNewOwner(member.id);
                          setTransferModalOpen(true);
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Organization Password</DialogTitle>
            <DialogDescription>
              Set a new password for organization security operations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-password">New Password</Label>
              <div className="relative">
                <Input
                  id="org-password"
                  type={showPassword ? "text" : "password"}
                  value={orgPassword}
                  onChange={(e) => setOrgPassword(e.target.value)}
                  placeholder="Enter organization password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>

            {orgPassword && orgPassword.length < 8 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Password must be at least 8 characters long
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePassword}
              disabled={updatingPassword || !orgPassword || orgPassword !== confirmPassword}
            >
              {updatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-700">Transfer Organization Ownership</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> You will lose all owner privileges and become an admin. 
                The new owner will have full control over the organization.
              </AlertDescription>
            </Alert>

            {selectedNewOwner && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">New Owner</h4>
                <p className="text-sm text-muted-foreground">
                  {eligibleMembers.find(m => m.id === selectedNewOwner)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {eligibleMembers.find(m => m.id === selectedNewOwner)?.email}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirm-transfer">
                Type <code>TRANSFER</code> to confirm
              </Label>
              <Input
                id="confirm-transfer"
                value={confirmTransfer}
                onChange={(e) => setConfirmTransfer(e.target.value)}
                placeholder="Type TRANSFER to confirm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleTransferOwnership}
              disabled={transferring || confirmTransfer !== "TRANSFER"}
            >
              {transferring ? "Transferring..." : "Transfer Ownership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
