"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Settings, 
  Eye, 
  Edit, 
  Crown,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  UserCheck,
  UserX,
  Copy,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { personalBoardCollaborationService } from "@/services/collaboration/personalBoardCollaborationService";
import { 
  PersonalBoardCollaborator, 
  PersonalBoardInvitation, 
  PersonalBoardSettings,
  PersonalBoardAccess,
  PERSONAL_BOARD_PERMISSIONS
} from "@/types/personal-board-collaboration";

interface PersonalBoardCollaborationManagerProps {
  userId: string;
  userName: string;
  userEmail: string;
  isOwner: boolean;
}

export default function PersonalBoardCollaborationManager({
  userId,
  userName,
  userEmail,
  isOwner
}: PersonalBoardCollaborationManagerProps) {
  const [collaborators, setCollaborators] = useState<PersonalBoardCollaborator[]>([]);
  const [settings, setSettings] = useState<PersonalBoardSettings | null>(null);
  const [invitations, setInvitations] = useState<PersonalBoardInvitation[]>([]);
  const [collaboratingBoards, setCollaboratingBoards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collaboratorsData, settingsData, invitationsData, boardsData, statsData] = await Promise.all([
        personalBoardCollaborationService.getPersonalBoardCollaborators(userId),
        personalBoardCollaborationService.getPersonalBoardSettings(userId),
        personalBoardCollaborationService.getPendingInvitations(userId),
        personalBoardCollaborationService.getCollaboratingBoards(userId),
        personalBoardCollaborationService.getCollaborationStats(userId)
      ]);
      
      setCollaborators(collaboratorsData);
      setSettings(settingsData);
      setInvitations(invitationsData);
      setCollaboratingBoards(boardsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch collaboration data:", error);
      toast({
        title: "Error",
        description: "Failed to load collaboration settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<PersonalBoardSettings>) => {
    if (!settings) return;
    
    try {
      setUpdating(true);
      const updatedSettings = await personalBoardCollaborationService.updatePersonalBoardSettings(
        userId, 
        updates
      );
      setSettings(updatedSettings);
      
      toast({
        title: "Settings Updated",
        description: "Personal board settings have been saved",
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

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (inviteEmail.toLowerCase() === userEmail.toLowerCase()) {
      toast({
        title: "Invalid Email",
        description: "You cannot invite yourself",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const invitation = await personalBoardCollaborationService.inviteCollaborator(
        userId,
        inviteEmail.trim(),
        inviteRole
      );
      
      setInvitations([...invitations, invitation]);
      setInviteEmail("");
      setInviteRole('viewer');
      
      toast({
        title: "Invitation Sent",
        description: `Collaboration invitation sent to ${inviteEmail}`,
      });
    } catch (error) {
      console.error("Failed to invite collaborator:", error);
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      await personalBoardCollaborationService.removeCollaborator(userId, collaboratorId);
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
      
      toast({
        title: "Collaborator Removed",
        description: "Collaborator has been removed from your board",
      });
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove collaborator",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    try {
      const updatedCollaborator = await personalBoardCollaborationService.updateCollaboratorRole(
        userId,
        collaboratorId,
        newRole
      );
      
      setCollaborators(prev => 
        prev.map(c => c.id === collaboratorId ? updatedCollaborator : c)
      );
      
      toast({
        title: "Role Updated",
        description: "Collaborator role has been updated",
      });
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update collaborator role",
        variant: "destructive",
      });
    }
  };

  const handleBulkRemove = async () => {
    if (selectedCollaborators.length === 0) return;
    
    try {
      const result = await personalBoardCollaborationService.bulkRemoveCollaborators(
        userId,
        selectedCollaborators
      );
      
      setCollaborators(prev => prev.filter(c => !result.removed.includes(c.id)));
      setSelectedCollaborators([]);
      
      toast({
        title: "Bulk Removal Complete",
        description: `Removed ${result.removed.length} collaborators${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
      });
    } catch (error) {
      console.error("Failed to bulk remove:", error);
      toast({
        title: "Bulk Removal Failed",
        description: "Failed to remove selected collaborators",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-amber-500" />;
      case 'editor': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'viewer': return <Eye className="h-4 w-4 text-green-500" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' as const;
      case 'editor': return 'secondary' as const;
      case 'viewer': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const toggleSelectAll = () => {
    if (selectedCollaborators.length === collaborators.length) {
      setSelectedCollaborators([]);
    } else {
      setSelectedCollaborators(collaborators.map(c => c.id));
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Personal Board Collaboration</h2>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalCollaborators}</div>
              <div className="text-sm text-muted-foreground">Total Collaborators</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeCollaborators}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingInvitations}</div>
              <div className="text-sm text-muted-foreground">Pending Invites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.collaboratingBoards}</div>
              <div className="text-sm text-muted-foreground">Collaborating On</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="collaborators" className="space-y-6">
        <TabsList>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="boards">Collaborating Boards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite Collaborator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inviteRole">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: 'viewer' | 'editor' | 'admin') => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Viewer
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  onClick={handleInviteCollaborator}
                  disabled={updating || !inviteEmail.trim() || !settings.allowCollaborators}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </Button>
                
                {!settings.allowCollaborators && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Collaboration is disabled. Enable it in Settings to invite collaborators.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Collaborators</CardTitle>
                {isOwner && selectedCollaborators.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkRemove}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Selected ({selectedCollaborators.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {collaborators.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Collaborators Yet</h3>
                  <p className="text-muted-foreground">
                    {isOwner 
                      ? "Invite team members to collaborate on your personal board"
                      : "This board doesn't have any collaborators yet"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {isOwner && collaborators.length > 1 && (
                    <div className="flex items-center gap-4 pb-2 border-b">
                      <Checkbox
                        checked={selectedCollaborators.length === collaborators.length}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedCollaborators.length} of {collaborators.length} selected
                      </span>
                    </div>
                  )}
                  
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {isOwner && collaborators.length > 1 && (
                          <Checkbox
                            checked={selectedCollaborators.includes(collaborator.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCollaborators([...selectedCollaborators, collaborator.id]);
                              } else {
                                setSelectedCollaborators(selectedCollaborators.filter(id => id !== collaborator.id));
                              }
                            }}
                          />
                        )}
                        
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {collaborator.userPhotoURL ? (
                            <img 
                              src={collaborator.userPhotoURL} 
                              alt={collaborator.userName}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-semibold">
                              {collaborator.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{collaborator.userName}</h4>
                            <Badge variant={getRoleBadgeVariant(collaborator.role)} className="flex items-center gap-1">
                              {getRoleIcon(collaborator.role)}
                              {collaborator.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{collaborator.userEmail}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3" />
                            <span>Joined {new Date(collaborator.acceptedAt || collaborator.invitedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={collaborator.role}
                            onValueChange={(value: 'viewer' | 'editor' | 'admin') => 
                              handleUpdateRole(collaborator.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {collaborator.userName} from your personal board? 
                                  They will lose access immediately.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveCollaborator(collaborator.id)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                  <p className="text-muted-foreground">
                    Sent invitations will appear here until they are accepted or expired.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{invitation.invitedEmail}</h4>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              {invitation.status}
                            </Badge>
                            <Badge variant={getRoleBadgeVariant(invitation.role)}>
                              {invitation.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Invited {new Date(invitation.createdAt).toLocaleDateString()} • 
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/invite/personal-board/${invitation.invitationCode}`;
                            navigator.clipboard.writeText(inviteUrl);
                            toast({
                              title: "Invitation Link Copied",
                              description: "Share this link with the invitee",
                            });
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Boards You're Collaborating On</CardTitle>
            </CardHeader>
            <CardContent>
              {collaboratingBoards.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Collaborative Boards</h3>
                  <p className="text-muted-foreground">
                    You haven&apos;t been invited to collaborate on any personal boards yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collaboratingBoards.map((board, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{board.boardOwnerName}&apos;s Board</h4>
                            <Badge variant={getRoleBadgeVariant(board.role)} className="flex items-center gap-1">
                              {getRoleIcon(board.role)}
                              {board.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{board.boardOwnerEmail}</p>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(board.acceptedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        View Board
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Collaboration Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Allow Collaborators</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to collaborate on your personal board
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowCollaborators}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ allowCollaborators: checked })
                    }
                    disabled={updating}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Private Board</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your board private (invite-only)
                    </p>
                  </div>
                  <Switch
                    checked={settings.isPrivate}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ isPrivate: checked })
                    }
                    disabled={updating}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Collaborator Role</Label>
                  <Select
                    value={settings.defaultCollaboratorRole}
                    onValueChange={(value: 'viewer' | 'editor') => 
                      handleSettingsUpdate({ defaultCollaboratorRole: value })
                    }
                    disabled={updating}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Viewer
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Editor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Default role assigned to new collaborators
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Maximum Collaborators</Label>
                  <Input
                    type="number"
                    value={settings.maxCollaborators}
                    onChange={(e) => 
                      handleSettingsUpdate({ 
                        maxCollaborators: parseInt(e.target.value) || 10 
                      })
                    }
                    className="w-32"
                    min="1"
                    max="50"
                    disabled={updating}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of collaborators allowed (1-50)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Settings Access Restricted</h3>
                <p className="text-muted-foreground text-center">
                  Only the board owner can modify collaboration settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
