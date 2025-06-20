"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building,
  Users,
  Settings,
  Crown,
  Calendar,
  Folder,
  Plus,
  UserPlus,
  ArrowLeft,
  MoreHorizontal,
  Mail,
  Trash2,
  Shield,
  UserCog,
  UserMinus,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import InvitationManager from "@/components/organizations/invitation-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface OrganizationDetailPageProps {
  params: {
    organizationId: string;
  };
}

export default function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: ""
  });
  const [memberUsers, setMemberUsers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  // Add projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshOrganizations, setWorkspace } = useWorkspace();
  const router = useRouter();

  const fetchMemberData = async (memberIds: string[]) => {
    if (!memberIds.length) return;

    try {
      setLoadingMembers(true);
      console.log("Fetching member data for:", memberIds);

      const response = await fetch('/api/users/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: memberIds }),
      });

      if (response.ok) {
        const users = await response.json();
        console.log("Fetched member data:", users);
        setMemberUsers(users);
      } else {
        console.error("Failed to fetch member data");
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      console.log("Fetching projects for organization:", params.organizationId);

      const response = await fetch(`/api/organizations/${params.organizationId}/projects`);
      
      if (response.ok) {
        const projectsData = await response.json();
        console.log("Fetched projects:", projectsData);
        setProjects(projectsData);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${params.organizationId}`);
      
      if (response.ok) {
        const org = await response.json();
        
        // Check if current user is a member of this organization
        const isOwner = org.ownerId === user?.uid;
        const isMember = org.members?.includes(user?.uid);
        
        // If user is not a member and not the owner, redirect them
        if (!isOwner && !isMember) {
          toast({
            title: "Access Denied",
            description: "You are not a member of this organization",
            variant: "destructive",
          });
          router.push("/organizations");
          return;
        }

        // Get the user's role from memberRoles or default based on ownership
        let userRole = "Member";
        if (isOwner) {
          userRole = "Owner";
        } else if (org.memberRoles && user?.uid && org.memberRoles[user.uid]) {
          const roleId = org.memberRoles[user.uid];
          userRole = roleId === "admin" ? "Admin" : "Member";
        }
        
        setOrganization({
          ...org,
          isOwner,
          userRole,
          currentUserIsMember: isMember || isOwner
        });

        // Fetch member data and projects after setting organization
        if (org.members && org.members.length > 0) {
          await fetchMemberData(org.members);
        }
        
        // Fetch projects
        await fetchProjects();
        
        // Refresh workspace context to ensure dropdown is up to date
        await refreshOrganizations();
      } else if (response.status === 404) {
        toast({
          title: "Organization Not Found",
          description: "This organization does not exist or has been deleted",
          variant: "destructive",
        });
        router.push("/organizations");
      } else {
        throw new Error("Failed to load organization");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive",
      });
      router.push("/organizations");
    } finally {
      setLoading(false);
    }
  }, [params.organizationId, user, toast, router]);

  useEffect(() => {
    fetchOrganization();
  }, [params.organizationId, user, fetchOrganization]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setInviting(true);
      
      const response = await fetch(`/api/organizations/${organization.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          roleId: inviteRole,
          inviterName: user?.displayName || user?.email || "Someone",
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteModalOpen(false);
        setInviteEmail("");
        setInviteRole("member");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === organization.ownerId) {
      toast({
        title: "Error",
        description: "Cannot remove the organization owner",
        variant: "destructive",
      });
      return;
    }

    try {
      setRemovingMember(memberId);
      
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state
        const updatedMembers = organization.members.filter((id: string) => id !== memberId);
        setOrganization({
          ...organization,
          members: updatedMembers,
          memberCount: updatedMembers.length
        });
        
        toast({
          title: "Success",
          description: "Member removed from organization",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setRemovingMember(null);
    }
  };

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingProject(true);
      
      const response = await fetch(`/api/organizations/${organization.id}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectForm.name.trim(),
          description: projectForm.description.trim(),
          ownerId: user?.uid,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        
        // Refresh project list from server to ensure consistency
        await fetchProjects();
        
        // Refresh workspace context to update dropdown
        await refreshOrganizations();
        
        setProjectModalOpen(false);
        setProjectForm({ name: "", description: "" });
        
        toast({
          title: "Success",
          description: `Project "${newProject.name}" created successfully`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setDeletingProject(projectId);
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update projects list
        setProjects(projects.filter(p => p.id !== projectId));
        
        // Refresh workspace context to update dropdown
        await refreshOrganizations();
        
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeletingProject(null);
    }
  };

  const formatDate = (dateValue: any) => {
    try {
      if (!dateValue) return "Unknown date";
      
      // Handle Firebase Timestamp objects
      if (dateValue && typeof dateValue.toDate === "function") {
        return dateValue.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
      
      // Handle ISO strings and regular dates
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Unknown date";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long", 
        day: "numeric"
      });
    } catch {
      return "Unknown date";
    }
  };

  const getMemberDisplayInfo = (memberId: string) => {
    const isOwner = memberId === organization.ownerId;
    const isCurrentUser = memberId === user?.uid;
    
    // Get role from organization.memberRoles or default based on ownership
    const memberRole = organization.memberRoles?.[memberId] || (isOwner ? "owner" : "member");
    
    // Find user data from fetched member data
    const userData = memberUsers.find(u => u.id === memberId);
    
    // For join date: owner uses org creation date, others use their actual join date
    let joinedAt = organization.createdAt; // Default fallback
    if (isOwner) {
      joinedAt = organization.createdAt; // Owner joined when org was created
    } else if (organization.memberJoinDates?.[memberId]) {
      joinedAt = organization.memberJoinDates[memberId]; // Use actual join date
    }
    
    console.log(`Member ${memberId} join date debug:`, {
      isOwner,
      isCurrentUser,
      rawJoinDate: organization.memberJoinDates?.[memberId],
      finalJoinDate: joinedAt,
      orgCreatedAt: organization.createdAt
    });
    
    if (isCurrentUser && user) {
      return {
        name: user.displayName || user.email || "You",
        role: isOwner ? "Owner" : (memberRole === "admin" ? "Admin" : "Member"),
        email: user.email || "",
        photoURL: user.photoURL,
        joinedAt: joinedAt,
        isOwner,
        isCurrentUser,
        roleId: memberRole
      };
    }
    
    if (userData) {
      return {
        name: userData.displayName || userData.email || "Team Member",
        role: isOwner ? "Owner" : (memberRole === "admin" ? "Admin" : "Member"),
        email: userData.email || "member@example.com",
        photoURL: userData.photoURL,
        joinedAt: joinedAt,
        isOwner,
        isCurrentUser: false,
        roleId: memberRole
      };
    }

    // Fallback for unknown users
    return {
      name: isOwner ? "Organization Owner" : "Team Member",
      role: isOwner ? "Owner" : (memberRole === "admin" ? "Admin" : "Member"),
      email: "member@example.com",
      photoURL: null,
      joinedAt: joinedAt,
      isOwner,
      isCurrentUser: false,
      roleId: memberRole
    };
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!organization.isOwner || memberId === organization.ownerId) {
      toast({
        title: "Error",
        description: "Cannot change owner role",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangingRole(memberId);
      
      console.log(`Attempting to change role for ${memberId} to ${newRole}`);
      
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      console.log(`Role change response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Role change successful:`, result);
        
        // Update local organization state
        const updatedMemberRoles = {
          ...organization.memberRoles,
          [memberId]: newRole
        };

        // If the current user's role was changed, update their role display
        let updatedUserRole = organization.userRole;
        if (memberId === user?.uid) {
          updatedUserRole = newRole === "admin" ? "Admin" : "Member";
        }

        setOrganization({
          ...organization,
          memberRoles: updatedMemberRoles,
          userRole: updatedUserRole
        });

        toast({
          title: "Success",
          description: `Member role updated to ${newRole === "admin" ? "Admin" : "Member"}`,
        });
      } else {
        const responseText = await response.text();
        console.error(`Role change failed with status ${response.status}:`, responseText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || "Failed to update role";
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${responseText}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setChangingRole(null);
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!organization.isOwner || newOwnerId === organization.ownerId) {
      toast({
        title: "Error",
        description: "Invalid ownership transfer",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organization.id}/transfer-ownership`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newOwnerId: newOwnerId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ownership transferred successfully",
        });
        
        // Refresh the organization data to reflect changes
        await fetchOrganization();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transfer ownership");
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Organization Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The organization you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/organizations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = organization && user && organization.ownerId === user.uid;
  const userRole = user && organization?.memberRoles && user.uid ? organization.memberRoles[user.uid] || 'member' : 'member';

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/organizations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {organization.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{organization.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={organization.isOwner ? "default" : organization.userRole === "Admin" ? "secondary" : "outline"}>
                      {organization.isOwner && <Crown className="h-3 w-3 mr-1" />}
                      {organization.userRole || "Member"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground ml-19">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{organization.memberCount || 1} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  <span>{projects.length} projects</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(organization.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/organizations/${organization.id}/settings`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {organization.isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => router.push(`/organizations/${organization.id}/settings?tab=danger`)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{organization.memberCount || 1}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="text-center py-8 text-muted-foreground">
              No recent activity to display
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Projects ({projects.length})</h3>
            {(organization.isOwner || organization.userRole === "Admin") && (
              <Button 
                onClick={() => setProjectModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}
          </div>

          {loadingProjects ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: any) => (
                <Card key={project.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold">{project.name}</h4>
                    {(organization.isOwner || project.ownerId === user?.uid) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={async () => {
                              await setWorkspace('organization', params.organizationId, project.id);
                              router.push(`/projects/${project.id}/dashboard`);
                            }}
                          >
                            <Folder className="mr-2 h-4 w-4" />
                            Open Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={async () => {
                              await setWorkspace('organization', params.organizationId, project.id);
                              router.push(`/projects/${project.id}/board`);
                            }}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            View Board
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-destructive"
                            disabled={deletingProject === project.id}
                          >
                            {deletingProject === project.id ? (
                              <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description || "No description"}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        // Ensure workspace context is updated before navigation
                        await setWorkspace('organization', params.organizationId, project.id);
                        router.push(`/projects/${project.id}/dashboard`);
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold mb-2">No Projects Yet</h4>
              <p className="text-muted-foreground mb-4">
                Projects help organize tasks and track progress toward your goals
              </p>
              {(organization.isOwner || organization.userRole === "Admin") && (
                <Button onClick={() => setProjectModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Members ({organization.memberCount || 1})</h3>
            {organization.isOwner && (
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            )}
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {organization.members?.map((memberId: string) => {
                const memberInfo = getMemberDisplayInfo(memberId);
                return (
                  <Card key={memberId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={memberInfo.photoURL || undefined} />
                          <AvatarFallback>
                            {memberInfo.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{memberInfo.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {memberInfo.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDate(memberInfo.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={memberInfo.isOwner ? "default" : memberInfo.roleId === "admin" ? "secondary" : "outline"}>
                          {memberInfo.isOwner && <Crown className="h-3 w-3 mr-1" />}
                          {memberInfo.role}
                        </Badge>
                        
                        {/* 3-dot menu for member actions */}
                        {organization.isOwner && !memberInfo.isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {/* Change Role Submenu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Change Role
                                    <ChevronRight className="ml-auto h-4 w-4" />
                                  </DropdownMenuItem>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right" alignOffset={-5}>
                                  <DropdownMenuItem 
                                    onClick={() => handleChangeRole(memberId, "member")}
                                    disabled={changingRole === memberId || memberInfo.roleId === "member"}
                                  >
                                    Member
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleChangeRole(memberId, "admin")}
                                    disabled={changingRole === memberId || memberInfo.roleId === "admin"}
                                  >
                                    Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Transfer Ownership (only for owner) */}
                              <DropdownMenuItem 
                                onClick={() => handleTransferOwnership(memberId)}
                                className="text-orange-600"
                                disabled={changingRole === memberId}
                              >
                                <Crown className="mr-2 h-4 w-4" />
                                Transfer Ownership
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Remove from Organization */}
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(memberId)}
                                className="text-destructive"
                                disabled={removingMember === memberId || changingRole === memberId}
                              >
                                {removingMember === memberId ? (
                                  <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <UserMinus className="mr-2 h-4 w-4" />
                                )}
                                Remove from Organization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          {organization.isOwner ? (
            <InvitationManager organizationId={organization.id} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <p>Only organization owners can manage invitations</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Member Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === "admin" ? "Can manage organization and invite others" : "Can view and work on projects"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteModalOpen(false);
                setInviteEmail("");
                setInviteRole("member");
              }}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Enter project name"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Description (Optional)</Label>
              <Textarea
                id="projectDescription"
                placeholder="Describe your project"
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProjectModalOpen(false)}
              disabled={creatingProject}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject} 
              disabled={creatingProject || !projectForm.name.trim()}
            >
              {creatingProject ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
