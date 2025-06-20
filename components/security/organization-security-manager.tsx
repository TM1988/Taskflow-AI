"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Key, 
  Users, 
  AlertTriangle, 
  Info, 
  Eye, 
  EyeOff,
  Copy,
  RefreshCw,
  Clock,
  UserCheck,
  X,
  Mail,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { organizationSecurityService } from "@/services/security/organizationSecurityService";
import { 
  OrganizationSecurity, 
  OwnershipTransfer, 
  SecurityAuditLog 
} from "@/types/organization-security";

interface OrganizationSecurityManagerProps {
  organizationId: string;
  isOwner: boolean;
  userRole: string;
  organizationName: string;
}

export default function OrganizationSecurityManager({
  organizationId,
  isOwner,
  userRole,
  organizationName
}: OrganizationSecurityManagerProps) {
  const [securitySettings, setSecuritySettings] = useState<OrganizationSecurity | null>(null);
  const [pendingTransfers, setPendingTransfers] = useState<OwnershipTransfer[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Password management state
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  
  // Ownership transfer state
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [transferPassword, setTransferPassword] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  useEffect(() => {
    if (newPassword) {
      const strength = organizationSecurityService.validatePasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settings, transfers, logs] = await Promise.all([
        organizationSecurityService.getSecuritySettings(organizationId),
        organizationSecurityService.getPendingTransfers(organizationId),
        organizationSecurityService.getSecurityAuditLogs(organizationId)
      ]);
      
      setSecuritySettings(settings);
      setPendingTransfers(transfers);
      setAuditLogs(logs);
    } catch (error) {
      console.error("Failed to fetch security data:", error);
      toast({
        title: "Error",
        description: "Failed to load security settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingsUpdate = async (updates: Partial<OrganizationSecurity>) => {
    if (!securitySettings) return;
    
    try {
      setUpdating(true);
      const updatedSettings = await organizationSecurityService.updateSecuritySettings(
        organizationId, 
        updates
      );
      setSecuritySettings(updatedSettings);
      
      toast({
        title: "Settings Updated",
        description: "Security settings have been saved",
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!passwordStrength?.isStrong) {
      toast({
        title: "Weak Password",
        description: "Please choose a stronger password",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      await organizationSecurityService.setOrganizationPassword(
        organizationId,
        newPassword,
        securitySettings?.passwordRequired ? currentPassword : undefined
      );
      
      // Update security settings to reflect password is now set
      await handleSecuritySettingsUpdate({ passwordRequired: true });
      
      setNewPassword("");
      setCurrentPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Password Set",
        description: "Organization password has been set successfully",
      });
    } catch (error) {
      console.error("Failed to set password:", error);
      toast({
        title: "Password Update Failed",
        description: error instanceof Error ? error.message : "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemovePassword = async () => {
    try {
      setUpdating(true);
      await organizationSecurityService.removeOrganizationPassword(
        organizationId,
        currentPassword
      );
      
      // Update security settings to reflect password is now removed
      await handleSecuritySettingsUpdate({ passwordRequired: false });
      
      setCurrentPassword("");
      
      toast({
        title: "Password Removed",
        description: "Organization password has been removed",
      });
    } catch (error) {
      console.error("Failed to remove password:", error);
      toast({
        title: "Password Removal Failed",
        description: error instanceof Error ? error.message : "Failed to remove password",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const generatePassword = () => {
    const generated = organizationSecurityService.generateSecurePassword(16);
    setNewPassword(generated);
    setConfirmPassword(generated);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  const handleOwnershipTransfer = async () => {
    if (!newOwnerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter the new owner's email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const transfer = await organizationSecurityService.initiateOwnershipTransfer(
        organizationId,
        newOwnerEmail.trim(),
        securitySettings?.passwordRequired ? transferPassword : undefined
      );
      
      setPendingTransfers([...pendingTransfers, transfer]);
      setNewOwnerEmail("");
      setTransferPassword("");
      
      toast({
        title: "Transfer Initiated",
        description: `Ownership transfer invitation sent to ${newOwnerEmail}`,
      });
    } catch (error) {
      console.error("Failed to initiate transfer:", error);
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to initiate ownership transfer",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    try {
      await organizationSecurityService.cancelOwnershipTransfer(transferId);
      setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
      
      toast({
        title: "Transfer Cancelled",
        description: "Ownership transfer has been cancelled",
      });
    } catch (error) {
      console.error("Failed to cancel transfer:", error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel ownership transfer",
        variant: "destructive",
      });
    }
  };

  if (loading || !securitySettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isOwner && userRole !== "admin") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground text-center">
            Only organization owners can access security settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Security Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General Security</TabsTrigger>
          <TabsTrigger value="password">Organization Password</TabsTrigger>
          <TabsTrigger value="transfer">Ownership Transfer</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Require Organization Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Members must enter organization password to access projects
                  </p>
                </div>
                <Switch
                  checked={securitySettings.passwordRequired}
                  onCheckedChange={(checked) => 
                    handleSecuritySettingsUpdate({ passwordRequired: checked })
                  }
                  disabled={updating || !securitySettings.password}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enforce Strong Passwords</Label>
                  <p className="text-sm text-muted-foreground">
                    Require strong passwords for all organization members
                  </p>
                </div>
                <Switch
                  checked={securitySettings.enforceStrongPasswords}
                  onCheckedChange={(checked) => 
                    handleSecuritySettingsUpdate({ enforceStrongPasswords: checked })
                  }
                  disabled={updating}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Session Timeout</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => 
                      handleSecuritySettingsUpdate({ 
                        sessionTimeout: parseInt(e.target.value) || 480 
                      })
                    }
                    className="w-32"
                    min="30"
                    max="1440"
                    disabled={updating}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after this period
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Organization Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {securitySettings.passwordRequired ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Organization password is currently active. Members need this password to access projects.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No organization password set. Set a password to add an extra layer of security.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {securitySettings.passwordRequired ? "Change Password" : "Set Password"}
                </h3>

                {securitySettings.passwordRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current organization password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new organization password"
                    />
                    <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generatePassword}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {newPassword && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={copyPassword}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new organization password"
                  />
                </div>

                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Password Strength:</span>
                      <Badge variant={passwordStrength.isStrong ? "default" : "destructive"}>
                        {passwordStrength.isStrong ? "Strong" : "Weak"}
                      </Badge>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {passwordStrength.feedback.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSetPassword}
                    disabled={
                      updating || 
                      !newPassword || 
                      !confirmPassword || 
                      newPassword !== confirmPassword ||
                      (securitySettings.passwordRequired && !currentPassword)
                    }
                  >
                    {securitySettings.passwordRequired ? "Change Password" : "Set Password"}
                  </Button>

                  {securitySettings.passwordRequired && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={updating}>
                          Remove Password
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Organization Password</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the organization password requirement. Members will no longer need a password to access projects.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRemovePassword}>
                            Remove Password
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ownership Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Transferring ownership will give the new owner full control over this organization. 
                  This action cannot be undone once the transfer is accepted.
                </AlertDescription>
              </Alert>

              {pendingTransfers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pending Transfers</h3>
                  {pendingTransfers.map((transfer) => (
                    <Card key={transfer.id} className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="font-medium">{transfer.newOwnerEmail}</span>
                              <Badge variant="outline">{transfer.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Expires {new Date(transfer.expiresAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelTransfer(transfer.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Transfer Ownership</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="newOwnerEmail">New Owner Email</Label>
                  <Input
                    id="newOwnerEmail"
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="Enter email of new owner"
                  />
                </div>

                {securitySettings.passwordRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="transferPassword">Organization Password</Label>
                    <Input
                      id="transferPassword"
                      type="password"
                      value={transferPassword}
                      onChange={(e) => setTransferPassword(e.target.value)}
                      placeholder="Enter organization password to confirm"
                    />
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      disabled={
                        updating || 
                        !newOwnerEmail.trim() ||
                        (securitySettings.passwordRequired && !transferPassword)
                      }
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Initiate Transfer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Transfer Organization Ownership</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to transfer ownership of "{organizationName}" to {newOwnerEmail}? 
                        This will send them an invitation email and you will lose owner privileges once they accept.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleOwnershipTransfer}>
                        Send Transfer Invitation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          {log.action === 'password_change' && <Key className="h-4 w-4" />}
                          {log.action === 'owner_transfer' && <Users className="h-4 w-4" />}
                          {log.action === 'security_settings_change' && <Shield className="h-4 w-4" />}
                          {log.action === 'member_access' && <UserCheck className="h-4 w-4" />}
                        </div>
                        
                        <div>
                          <div className="font-medium">{log.details}</div>
                          <div className="text-sm text-muted-foreground">
                            by {log.userEmail} • {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                  <p className="text-muted-foreground">
                    Security audit logs will appear here when security actions are performed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
