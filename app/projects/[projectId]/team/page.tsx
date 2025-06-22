"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { User, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProjectTeamPage() {
  const params = useParams();
  const [members, setMembers] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const { toast } = useToast();
  const router = useRouter();

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${params.projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch organization members with full details if project belongs to org
        if (projectData.organizationId) {
          const orgResponse = await fetch(`/api/organizations/${projectData.organizationId}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            
            // Fetch detailed member information for each organization member
            const memberDetailsPromises = (orgData.members || []).map(async (memberId: string) => {
              try {
                const memberResponse = await fetch(`/api/users/${memberId}`);
                if (memberResponse.ok) {
                  const memberData = await memberResponse.json();
                  
                  // Get the member's role from organization data
                  const isOwner = orgData.ownerId === memberId;
                  const memberRole = isOwner ? 'owner' : (orgData.memberRoles?.[memberId] || 'member');
                  
                  return {
                    id: memberId,
                    name: memberData.displayName || memberData.name || memberData.email || 'Unknown',
                    email: memberData.email || 'Unknown',
                    photoURL: memberData.photoURL || null,
                    role: memberRole
                  };
                }
              } catch (error) {
                console.error(`Error fetching member ${memberId}:`, error);
              }
              return {
                id: memberId,
                name: 'Unknown',
                email: 'Unknown',
                photoURL: null,
                role: 'member'
              };
            });

            const memberDetails = await Promise.all(memberDetailsPromises);
            setOrgMembers(memberDetails);
          }
        }
      }

      // Fetch project members
      const membersResponse = await fetch(`/api/projects/${params.projectId}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
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
      const selectedMemberData = orgMembers.find(m => m.id === selectedMember);
      if (!selectedMemberData) {
        throw new Error("Selected member not found");
      }

      // Get the member's role from the organization (default to 'member' if not specified)
      const memberOrgRole = selectedMemberData.role || 'member';

      const response = await fetch(`/api/projects/${params.projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember,
          role: memberOrgRole,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member added to project",
        });
        setShowAddMember(false);
        setSelectedMember("");
        fetchProjectData(); // Refresh data
      } else {
        throw new Error("Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "Failed to add member to project",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (params.projectId) {
      fetchProjectData();
    }
  }, [params.projectId]); // Remove fetchProjectData from dependencies to prevent infinite loop

  // Filter org members who are not already project members
  const availableMembers = orgMembers.filter(
    orgMember => !members.some(projMember => projMember.id === orgMember.id)
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Project Team</h1>
          <p className="text-muted-foreground mt-2">
            Manage team members and their roles in this project
          </p>
        </div>
        <Button onClick={() => setShowAddMember(true)}>
          <Plus className="h-4 w-4 mr-2" />
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
                  {member.name ? member.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.role === "owner" ? "default" : "outline"}>
                  {member.role === "owner" ? "Owner" : member.role || "Member"}
                </Badge>
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
              Select an organization member to add to this project. They will keep their current organization role.
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
                    <SelectItem value="none" disabled>No available members</SelectItem>
                  ) : (
                    availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{member.name} ({member.email})</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {member.role === 'owner' ? 'Owner' : member.role || 'Member'}
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
            <Button
              onClick={addMemberToProject}
              disabled={!selectedMember}
            >
              Add to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
