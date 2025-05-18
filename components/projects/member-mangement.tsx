// components/projects/member-management.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  X,
  UserPlus,
  Mail,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { projectService } from "@/services/projects/projectService";

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export default function MemberManagement({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMembers = async () => {
      if (!projectId) return;

      try {
        setLoading(true);

        // Get project detail including members
        const project = await projectService.getProject(projectId);

        if (!project || !project.members) {
          setMembers([]);
          return;
        }

        // Fetch detailed information about each member
        const memberProfiles = await Promise.all(
          project.members.map(async (memberId: string) => {
            try {
              // You'll need to implement this endpoint
              const response = await fetch(`/api/users/${memberId}`);
              if (response.ok) {
                const userData = await response.json();
                return {
                  id: memberId,
                  name: userData.displayName || "Unknown User",
                  email: userData.email || "",
                  avatarUrl: userData.photoURL,
                  role: memberId === project.ownerId ? "owner" : "member",
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching member ${memberId}:`, error);
              return null;
            }
          }),
        );

        // Filter out any failed fetches
        const validMembers = memberProfiles.filter(Boolean) as Member[];
        setMembers(validMembers);
        setFilteredMembers(validMembers);
      } catch (error) {
        console.error("Error fetching project members:", error);
        toast({
          title: "Error",
          description: "Failed to load project members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [projectId, toast]);

  // Filter members when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query),
    );

    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);

      // Call your API to send invitation
      const response = await fetch("/api/projects/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteDialogOpen(false);
        setInviteEmail("");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (
      !confirm("Are you sure you want to remove this member from the project?")
    ) {
      return;
    }

    try {
      await projectService.removeProjectMember(projectId, memberId);

      // Update the local state
      setMembers(members.filter((member) => member.id !== memberId));
      setFilteredMembers(
        filteredMembers.filter((member) => member.id !== memberId),
      );

      toast({
        title: "Member removed",
        description: "The member has been removed from this project",
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member from project",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <CardTitle>Project Team</CardTitle>
            <CardDescription>
              Manage team members and their access
            </CardDescription>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                      ) : (
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {member.role}
                    </div>
                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No members match your search"
                : "No members in this project yet"}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="colleague@example.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="member">Member</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={inviting || !inviteEmail}
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
