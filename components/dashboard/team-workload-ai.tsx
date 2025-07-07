"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GitCommit } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  workload: {
    totalTasks: number;
    capacity: number;
    completedTasks: number;
    overdueTasks: number;
    workloadScore: number;
  };
  github?: {
    commits: number;
    pullRequests: number;
  };
}

interface TeamWorkloadAIProps {
  projectId?: string;
}

export default function TeamWorkload({ projectId }: TeamWorkloadAIProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useWorkspace();

  useEffect(() => {
    console.log(
      "🎯 [TEAM WORKLOAD] Component mounted/updated - ProjectId:",
      projectId,
    );
    console.log(
      "🔄 [TEAM WORKLOAD] Effect triggered with projectId:",
      projectId,
    );
    if (projectId && projectId !== "personal") {
      fetchTeamWorkload();

      // Set up polling to refresh workload data every 30 seconds
      console.log("⏰ [TEAM WORKLOAD] Setting up 30-second polling interval");
      const interval = setInterval(() => {
        console.log(
          "🔄 [TEAM WORKLOAD] Polling interval triggered - refreshing workload data",
        );
        fetchTeamWorkload();
      }, 30000);

      // Listen for workload changes
      const handleWorkloadChange = (event: CustomEvent) => {
        if (event.detail?.projectId === projectId) {
          console.log(
            "🔄 [TEAM WORKLOAD] Workload change event received - refreshing data",
          );
          fetchTeamWorkload();
        }
      };

      window.addEventListener(
        "workloadChanged",
        handleWorkloadChange as EventListener,
      );

      return () => {
        console.log(
          "🛑 [TEAM WORKLOAD] Cleaning up polling interval and event listener",
        );
        clearInterval(interval);
        window.removeEventListener(
          "workloadChanged",
          handleWorkloadChange as EventListener,
        );
      };
    } else {
      console.log(
        "⏭️ [TEAM WORKLOAD] Personal project or no project - skipping workload fetch",
      );
      setLoading(false);
      setTeamMembers([]);
    }
  }, [projectId]);

  const fetchTeamWorkload = async () => {
    if (!projectId || projectId === "personal") {
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First fetch project members with organization context
      const membersApiUrl = currentOrganization?.id 
        ? `/api/projects/${projectId}/members?organizationId=${currentOrganization.id}`
        : `/api/projects/${projectId}/members`;
      
      console.log("🌐 [TEAM WORKLOAD] Fetching members from:", membersApiUrl);
      const membersResponse = await fetch(membersApiUrl);
      if (!membersResponse.ok) {
        throw new Error("Failed to fetch project members");
      }

      const members = await membersResponse.json();
      console.log("👥 [TEAM WORKLOAD] Got members:", {
        memberCount: members.length,
        memberNames: members.map((m: any) => m.name),
        organizationId: currentOrganization?.id
      });

      // Then fetch workload data for each member
      const workloadPromises = members.map(async (member: any) => {
        try {
          const workloadApiUrl = `/api/analytics/member-workload?projectId=${projectId}&memberId=${member.id}${currentOrganization?.id ? `&organizationId=${currentOrganization.id}` : ""}`;
          console.log(`📊 [TEAM WORKLOAD] Fetching workload for ${member.name} from:`, workloadApiUrl);
          
          const workloadResponse = await fetch(workloadApiUrl);

          let workloadData = {
            activeTasks: 0,
            assignedTasks: 0,
            capacity: 10,
            taskLimit: 10,
            completedThisWeek: 0,
            overdueTasks: 0,
            workloadPercentage: 0,
          };

          if (workloadResponse.ok) {
            const responseData = await workloadResponse.json();
            console.log(
              `📈 [TEAM WORKLOAD] Workload API response for ${member.name} (${member.id}):`,
              responseData,
            );

            // Handle both old and new API field formats
            workloadData = {
              activeTasks:
                responseData.activeTasks || responseData.assignedTasks || 0,
              assignedTasks:
                responseData.assignedTasks || responseData.activeTasks || 0,
              capacity: responseData.capacity || responseData.taskLimit || 10,
              taskLimit: responseData.taskLimit || responseData.capacity || 10,
              completedThisWeek: responseData.completedThisWeek || 0,
              overdueTasks: responseData.overdueTasks || 0,
              workloadPercentage: responseData.workloadPercentage || 0,
            };
          } else {
            console.warn(`⚠️ [TEAM WORKLOAD] Workload API failed for ${member.name}:`, {
              status: workloadResponse.status,
              statusText: workloadResponse.statusText,
              url: workloadApiUrl
            });
          }

          // Ensure we have valid numbers
          const totalTasks = Math.max(
            0,
            workloadData.activeTasks || workloadData.assignedTasks || 0,
          );
          const capacity = Math.max(
            1,
            workloadData.capacity || workloadData.taskLimit || 10,
          );
          const completedTasks = Math.max(
            0,
            workloadData.completedThisWeek || 0,
          );
          const overdueTasks = Math.max(0, workloadData.overdueTasks || 0);

          // Calculate workload score with proper validation
          const workloadScore =
            isNaN(totalTasks) || isNaN(capacity)
              ? 0
              : Math.min(100, Math.round((totalTasks / capacity) * 100));

          const teamMember: TeamMember = {
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.photoURL,
            role: member.role,
            workload: {
              totalTasks: totalTasks,
              capacity: capacity,
              completedTasks: completedTasks,
              overdueTasks: overdueTasks,
              workloadScore: workloadScore,
            },
            github: undefined, // We'll add GitHub integration later
          };

          return teamMember;
        } catch (error) {
          console.error(
            `Error fetching workload for member ${member.id}:`,
            error,
          );
          // Return member with default data if workload fetch fails
          const teamMember: TeamMember = {
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.photoURL,
            role: member.role,
            workload: {
              totalTasks: 0,
              capacity: 10,
              completedTasks: 0,
              overdueTasks: 0,
              workloadScore: 0,
            },
            github: undefined,
          };
          return teamMember;
        }
      });

      const teamData = await Promise.all(workloadPromises);
      setTeamMembers(teamData);
      setError(null);
    } catch (err) {
      console.error("Error fetching team workload:", err);
      setError("Failed to load team workload data");
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadLevel = (score: number): string => {
    if (isNaN(score) || score < 0) return "low";
    if (score < 50) return "low";
    if (score <= 80) return "medium";
    return "high";
  };

  const getWorkloadLevelColor = (level: string): string => {
    switch (level) {
      case "low":
        return "text-blue-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getWorkloadColor = (score: number) => {
    if (isNaN(score) || score < 0) return "text-muted-foreground";
    if (score >= 85) return "text-red-500";
    if (score >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getWorkloadBgColor = (score: number) => {
    if (isNaN(score) || score < 0) return "bg-gray-100 dark:bg-gray-950";
    if (score >= 85) return "bg-red-100 dark:bg-red-950";
    if (score >= 70) return "bg-yellow-100 dark:bg-yellow-950";
    return "bg-green-100 dark:bg-green-950";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
          </CardTitle>
          <CardDescription>
            Team workload analysis and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
          </CardTitle>
          <CardDescription>
            Team workload analysis and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeamWorkload}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projectId || projectId === "personal") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
          </CardTitle>
          <CardDescription>
            Team workload analysis and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              This feature is only available in team projects
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teamMembers.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
          </CardTitle>
          <CardDescription>
            Team workload analysis and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No team members found in this project
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add team members in the project settings
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Workload
        </CardTitle>
        <CardDescription>Team workload analysis and monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {teamMembers.map((member) => (
          <div key={member.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>
                  {member.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{member.name}</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${getWorkloadColor(member.workload.workloadScore)}`}
                    >
                      {isNaN(member.workload.workloadScore)
                        ? "0"
                        : Math.round(member.workload.workloadScore)}
                      % workload
                    </span>
                    <Badge
                      className={`text-xs ${getWorkloadLevelColor(getWorkloadLevel(member.workload.workloadScore))}`}
                      variant="outline"
                    >
                      {getWorkloadLevel(member.workload.workloadScore)}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={
                    isNaN(member.workload.workloadScore)
                      ? 0
                      : member.workload.workloadScore
                  }
                  className="h-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Current Workload</p>
                <div className="flex items-center gap-2">
                  <span>
                    {member.workload.totalTasks}/{member.workload.capacity}{" "}
                    tasks
                  </span>
                  {member.workload.overdueTasks > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {member.workload.overdueTasks} overdue
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.workload.completedTasks} completed this week
                </div>
              </div>
              {member.github && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">GitHub Activity</p>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3 w-3" />
                      {member.github.commits}
                    </span>
                    <span>{member.github.pullRequests} PRs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
