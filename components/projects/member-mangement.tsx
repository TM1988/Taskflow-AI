// components/projects/member-management.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Mail, X, Loader2, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Member {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
}

export default function MemberManagement({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteMemberData, setInviteMemberData] = useState({
    email: "",
    userId: "",
    role: "member",
  });
  const [inviting, setInviting] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch project members
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      console.log("🔍 Fetching members for project:", projectId);

      // Use the proper API endpoint for project members
      const response = await fetch(`/api/projects/${projectId}/members`);

      if (response.ok) {
        const membersData = await response.json();
        console.log("✅ Fetched project members:", membersData);

        setMembers(membersData || []);
        setFilteredMembers(membersData || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch members");
      }
    } catch (error) {
      console.error("❌ Error fetching project members:", error);
      toast({
        title: "Error",
        description: "Failed to load project members",
        variant: "destructive",
      });
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Initial fetch
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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

  // Handle adding member to project
  const handleAddMember = async () => {
    const { email, userId, role } = inviteMemberData;

    if (!email.trim() && !userId.trim()) {
      toast({
        title: "Error",
        description: "Email or User ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setInviting(true);

      console.log("➕ Adding member to project:", {
        projectId,
        email,
        userId,
        role,
      });

      // Use the correct API endpoint to add member directly to project
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim() || undefined,
          userId: userId.trim() || undefined,
          role: role,
        }),
      });

      if (response.ok) {
        const newMember = await response.json();
        console.log("✅ Member added successfully:", newMember);

        // Add the new member to local state
        setMembers((prev) => [...prev, newMember]);
        setFilteredMembers((prev) => [...prev, newMember]);

        toast({
          title: "Success! 🎉",
          description: `Member ${newMember.name || newMember.email} has been added to the project`,
        });

        // Reset form and close dialog
        setInviteMemberData({ email: "", userId: "", role: "member" });
        setInviteDialogOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }
    } catch (error) {
      console.error("❌ Error adding member:", error);
      toast({
        title: "Failed to Add Member",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  // Handle removing member from project
  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (member.role === "owner") {
      toast({
        title: "Cannot Remove Owner",
        description: "Project owners cannot be removed from their projects",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove ${member.name || member.email} from this project?`,
      )
    ) {
      return;
    }

    try {
      setRemovingMember(memberId);

      console.log("🗑️ Removing member from project:", { projectId, memberId });

      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        console.log("✅ Member removed successfully");

        // Remove member from local state
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setFilteredMembers((prev) => prev.filter((m) => m.id !== memberId));

        toast({
          title: "Member Removed",
          description: `${member.name || member.email} has been removed from the project`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("❌ Error removing member:", error);
      toast({
        title: "Failed to Remove Member",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setRemovingMember(null);
    }
  };

  const handleDialogClose = () => {
    if (!inviting) {
      setInviteMemberData({ email: "", userId: "", role: "member" });
      setInviteDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Project Team
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Manage team members and their access to this project
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMembers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              disabled={loading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              disabled={loading}
            />
          </div>

          {/* Members List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading team members...
                </p>
              </div>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.photoURL ? (
                        <AvatarImage src={member.photoURL} alt={member.name} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase() ||
                            member.email?.substring(0, 2).toUpperCase() ||
                            "??"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {member.name || "Unknown User"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        member.role === "owner"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : member.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {member.role}
                    </div>
                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMember === member.id}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {removingMember === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <div className="text-muted-foreground">
                {searchQuery
                  ? "No members match your search criteria"
                  : "No team members found"}
              </div>
              {!searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                  className="mt-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Team Member
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Team Member
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="memberEmail"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteMemberData.email}
                  onChange={(e) =>
                    setInviteMemberData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="pl-8"
                  disabled={inviting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The email address of the user you want to add
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberUserId">User ID (Optional)</Label>
              <Input
                id="memberUserId"
                type="text"
                placeholder="Enter user ID if known"
                value={inviteMemberData.userId}
                onChange={(e) =>
                  setInviteMemberData((prev) => ({
                    ...prev,
                    userId: e.target.value,
                  }))
                }
                disabled={inviting}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if you only have the email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberRole">Role</Label>
              <Select
                value={inviteMemberData.role}
                onValueChange={(value) =>
                  setInviteMemberData((prev) => ({ ...prev, role: value }))
                }
                disabled={inviting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteMemberData.role === "admin"
                  ? "Can manage project settings and members"
                  : inviteMemberData.role === "viewer"
                    ? "Can only view project content"
                    : "Can participate in project activities"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={
                inviting ||
                (!inviteMemberData.email.trim() &&
                  !inviteMemberData.userId.trim())
              }
            >
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
