"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clearAssigneeCache } from "@/components/ui/assignee-dropdown-extreme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { User, Plus, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { resolveRoleName } from "@/utils/role-name-resolver";
import { useAuth } from "@/services/auth/AuthContext";

export default function ProjectTeamPage() {
  const params = useParams();
  const [members, setMembers] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${params.projectId}`);
      let projectData = null;
      if (projectResponse.ok) {
        projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch organization members with full details if project belongs to org
        if (projectData.organizationId) {
          const orgResponse = await fetch(
            `/api/organizations/${projectData.organizationId}`,
          );
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();

            // Fetch detailed member information for each organization member
            const memberDetailsPromises = (orgData.members || []).map(
              async (memberId: string) => {
                try {
                  const memberResponse = await fetch(`/api/users/${memberId}`);
                  if (memberResponse.ok) {
                    const memberData = await memberResponse.json();

                    // Get the member's role from organization data
                    const isOwner = orgData.ownerId === memberId;
                    const memberRole = isOwner
                      ? "owner"
                      : orgData.memberRoles?.[memberId] || "member";

                    return {
                      id: memberId,
                      name:
                        memberData.displayName ||
                        memberData.name ||
                        memberData.email ||
                        "Unknown",
                      email: memberData.email || "Unknown",
                      photoURL: memberData.photoURL || null,
                      role: memberRole,
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching member ${memberId}:`, error);
                }
                return {
                  id: memberId,
                  name: "Unknown",
                  email: "Unknown",
                  photoURL: null,
                  role: "member",
                };
              },
            );

            const memberDetails = await Promise.all(memberDetailsPromises);
            setOrgMembers(memberDetails);
          }
        }
      }

      // Fetch project members with cache busting
      let membersApiUrl = `/api/projects/${params.projectId}/members?t=${Date.now()}&cacheBust=${Math.random()}`;
      if (projectData.organizationId) {
        membersApiUrl += `&organizationId=${projectData.organizationId}`;
      }

      const membersResponse = await fetch(membersApiUrl, {
        cache: "no-cache",
      });
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        console.log("Fetched project members in team page:", membersData);
        setMembers(membersData);
      } else {
        console.error(
          "Failed to fetch project members:",
          await membersResponse.text(),
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMemberToProject = async () => {
    if (!selectedMember) return;

    try {
      // Find the selected member to get their organization role
      const selectedMemberData = orgMembers.find(
        (m) => m.id === selectedMember,
      );
      if (!selectedMemberData) {
        throw new Error("Selected member not found");
      }

      // Get the member's role from the organization (default to 'member' if not specified)
      const memberOrgRole = selectedMemberData.role || "member";

      // Add organization context for MongoDB projects
      let apiUrl = `/api/projects/${params.projectId}/members`;
      if (project?.organizationId) {
        apiUrl += `?organizationId=${project.organizationId}`;
      }

      console.log("Adding member request:", {
        apiUrl,
        userId: selectedMember,
        role: memberOrgRole,
        organizationId: project?.organizationId,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember,
          role: memberOrgRole,
          organizationId: project?.organizationId, // Include in body as well
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member added to project",
        });
        setShowAddMember(false);
        setSelectedMember("");

        // Clear assignee cache immediately
        clearAssigneeCache(params.projectId as string);

        // Also invalidate using the new function
        if (
          typeof window !== "undefined" &&
          (window as any).invalidateProjectMembersCache
        ) {
          (window as any).invalidateProjectMembersCache(params.projectId as string);
        }

        // Refresh data immediately without delay
        fetchProjectData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add member to project",
        variant: "destructive",
      });
    }
  };

  const removeMemberFromProject = async (memberId: string) => {
    try {
      setRemovingMember(memberId);

      // Add organization context for MongoDB projects
      let apiUrl = `/api/projects/${params.projectId}/members?userId=${memberId}`;
      if (project?.organizationId) {
        apiUrl += `&organizationId=${project.organizationId}`;
      }

      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member removed from project",
        });

        // Clear assignee cache immediately
        clearAssigneeCache(params.projectId as string);

        // Also invalidate using the new function
        if (
          typeof window !== "undefined" &&
          (window as any).invalidateProjectMembersCache
        ) {
          (window as any).invalidateProjectMembersCache(params.projectId as string);
        }

        // Refresh data immediately
        fetchProjectData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove member from project",
        variant: "destructive",
      });
    } finally {
      setRemovingMember(null);
    }
  };

  useEffect(() => {
    if (params.projectId) {
      fetchProjectData();
    }
  }, [params.projectId]); // Remove fetchProjectData from dependencies to prevent infinite loop

  // Filter org members who are not already project members
  const availableMembers = orgMembers.filter(
    (orgMember) =>
      !members.some((projMember) => projMember.id === orgMember.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex-1">Team Members</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProjectData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id} className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.photoURL} alt={member.name} />
                <AvatarFallback>
                  {member.name ? (
                    member.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={member.role === "owner" ? "default" : "outline"}
                >
                  {resolveRoleName(member.role || "member", project?.organization)}
                </Badge>
                {/* Only show remove button for non-owners and if current user is owner */}
                {member.role !== "owner" && project?.ownerId === user?.uid && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={removingMember === member.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {member.name} from
                          this project? They will lose access to all project
                          tasks and data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMemberFromProject(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {removingMember === member.id
                            ? "Removing..."
                            : "Remove Member"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Project</DialogTitle>
            <DialogDescription>
              Select an organization member to add to this project. They will
              keep their current organization role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select
                onValueChange={(value) => setSelectedMember(value)}
                value={selectedMember}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available members
                    </SelectItem>
                  ) : (
                    availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {member.name} ({member.email})
                          </span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {member.role === "owner"
                              ? "Owner"
                              : member.role || "Member"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={addMemberToProject} disabled={!selectedMember}>
              Add to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
