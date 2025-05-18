"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Mail,
  Github,
  Linkedin,
  Search,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  email: string;
  github?: string;
  linkedin?: string;
  status: "active" | "away" | "offline";
  skills: string[];
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Use API endpoint instead of direct service call
        const response = await fetch(`/api/team-members?userId=${user.uid}`);

        if (response.ok) {
          const members = await response.json();
          setTeamMembers(members);
          setFilteredMembers(members);
        } else {
          throw new Error("Failed to fetch team members");
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user, toast]);

  // Filter members when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMembers(teamMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = teamMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.skills.some((skill) => skill.toLowerCase().includes(query)),
    );

    setFilteredMembers(filtered);
  }, [searchQuery, teamMembers]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setLoading(true);

      // Get the first project to add this member to - using API endpoint instead of projectService
      const projectsResponse = await fetch(`/api/projects?userId=${user?.uid}`);
      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }
      
      const projects = await projectsResponse.json();
      if (projects.length === 0) {
        toast({
          title: "Error",
          description: "You need to create a project first",
          variant: "destructive",
        });
        return;
      }

      // Send invitation
      const response = await fetch("/api/projects/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projects[0].id,
          email: inviteEmail,
          role: "member",
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setAddDialogOpen(false);
        setInviteEmail("");
      } else {
        throw new Error("Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/40 p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>{member.role}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      member.status === "active" ? "default" : "secondary"
                    }
                    className="ml-auto"
                  >
                    {member.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, j) => (
                        <Badge key={j} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`mailto:${member.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                    {member.github && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={`https://github.com/${member.github}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {member.linkedin && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={`https://linkedin.com/in/${member.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 col-span-full">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                No team members found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No team members match your search"
                  : "Start building your team by inviting members"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail}>
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
