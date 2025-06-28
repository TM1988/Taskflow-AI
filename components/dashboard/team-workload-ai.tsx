'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, AlertTriangle, CheckCircle2, GitCommit, Calendar } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  workload: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    workloadScore: number; // 0-100
  };
  github?: {
    commits: number;
    pullRequests: number;
    lastActivity: string;
  };
  aiSuggestions: WorkloadSuggestion[];
}

interface WorkloadSuggestion {
  type: 'help_needed' | 'redistribute' | 'celebrate' | 'check_in';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
}

interface TeamWorkloadAIProps {
  projectId?: string;
}

export default function TeamWorkloadAI({ projectId }: TeamWorkloadAIProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && projectId !== "personal") {
      fetchTeamWorkload();
    } else {
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
      
      // First fetch project members
      const membersResponse = await fetch(`/api/projects/${projectId}/members`);
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch project members');
      }
      
      const members = await membersResponse.json();
      
      // Then fetch workload data for each member
      const workloadPromises = members.map(async (member: any) => {
        try {
          const workloadResponse = await fetch(
            `/api/analytics/member-workload?projectId=${projectId}&memberId=${member.id}`
          );
          
          let workloadData = { activeTasks: 0, capacity: 10, completedThisWeek: 0, overdueTasks: 0 };
          
          if (workloadResponse.ok) {
            workloadData = await workloadResponse.json();
          }
          
          const workloadScore = Math.min(100, (workloadData.activeTasks / workloadData.capacity) * 100);
          
          const teamMember: TeamMember = {
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.photoURL,
            role: member.role,
            workload: {
              totalTasks: workloadData.activeTasks,
              completedTasks: workloadData.completedThisWeek,
              overdueTasks: workloadData.overdueTasks,
              workloadScore: workloadScore,
            },
            github: undefined, // We'll add GitHub integration later
            aiSuggestions: []
          };
          
          // Generate AI suggestions for this member
          teamMember.aiSuggestions = generateWorkloadSuggestions(teamMember);
          
          return teamMember;
        } catch (error) {
          console.error(`Error fetching workload for member ${member.id}:`, error);
          // Return member with default data if workload fetch fails
          const teamMember: TeamMember = {
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.photoURL,
            role: member.role,
            workload: {
              totalTasks: 0,
              completedTasks: 0,
              overdueTasks: 0,
              workloadScore: 0,
            },
            github: undefined,
            aiSuggestions: []
          };
          return teamMember;
        }
      });
      
      const teamData = await Promise.all(workloadPromises);
      setTeamMembers(teamData);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching team workload:', err);
      setError('Failed to load team workload data');
    } finally {
      setLoading(false);
    }
  };

  const generateWorkloadSuggestions = (member: TeamMember): WorkloadSuggestion[] => {
    const suggestions: WorkloadSuggestion[] = [];
    const { workload } = member;
    
    // High workload detection
    if (workload.workloadScore > 85) {
      suggestions.push({
        type: 'help_needed',
        priority: 'high',
        message: `${member.name} has a very high workload (${workload.totalTasks} tasks). Consider redistributing some tasks.`,
        action: 'Redistribute tasks',
      });
    }
    
    // Overdue tasks
    if (workload.overdueTasks > 2) {
      suggestions.push({
        type: 'check_in',
        priority: 'high',
        message: `${member.name} has ${workload.overdueTasks} overdue tasks. They might need support or deadline adjustments.`,
        action: 'Schedule check-in',
      });
    }
    
    // High performance recognition
    if (workload.completedTasks > 8 && workload.overdueTasks === 0) {
      suggestions.push({
        type: 'celebrate',
        priority: 'low',
        message: `${member.name} is performing excellently with ${workload.completedTasks} completed tasks and no overdue items!`,
        action: 'Send recognition',
      });
    }
    
    // Balanced workload
    if (workload.workloadScore >= 60 && workload.workloadScore <= 80 && workload.overdueTasks <= 1) {
      suggestions.push({
        type: 'redistribute',
        priority: 'low',
        message: `${member.name} has a healthy workload balance. Consider assigning additional strategic tasks.`,
        action: 'Assign priority tasks',
      });
    }
    
    // Low workload
    if (workload.workloadScore < 30 && workload.totalTasks < 3) {
      suggestions.push({
        type: 'redistribute',
        priority: 'medium',
        message: `${member.name} has capacity for more tasks. Consider assigning additional work.`,
        action: 'Assign more tasks',
      });
    }
    
    return suggestions.slice(0, 2); // Limit to 2 suggestions per member
  };

  const getWorkloadColor = (score: number) => {
    if (score >= 85) return 'text-red-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getWorkloadBgColor = (score: number) => {
    if (score >= 85) return 'bg-red-100 dark:bg-red-950';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-950';
    return 'bg-green-100 dark:bg-green-950';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'help_needed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'redistribute': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'celebrate': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'check_in': return <Calendar className="h-4 w-4 text-orange-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSuggestionBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload AI
          </CardTitle>
          <CardDescription>AI-powered team workload analysis and suggestions</CardDescription>
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
            Team Workload AI
          </CardTitle>
          <CardDescription>AI-powered team workload analysis and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTeamWorkload} className="mt-2">
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
            Team Workload AI
          </CardTitle>
          <CardDescription>AI-powered team workload analysis and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">This feature is only available in team projects</p>
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
            Team Workload AI
          </CardTitle>
          <CardDescription>AI-powered team workload analysis and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members found in this project</p>
            <p className="text-xs text-muted-foreground mt-1">Add team members in the project settings</p>
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
          Team Workload AI
        </CardTitle>
        <CardDescription>AI-powered team workload analysis and suggestions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {teamMembers.map((member) => (
          <div key={member.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{member.name}</h4>
                  <span className={`text-xs font-medium ${getWorkloadColor(member.workload.workloadScore)}`}>
                    {member.workload.workloadScore}% workload
                  </span>
                </div>
                <Progress 
                  value={member.workload.workloadScore} 
                  className="h-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Tasks</p>
                <div className="flex items-center gap-2">
                  <span>{member.workload.completedTasks}/{member.workload.totalTasks} completed</span>
                  {member.workload.overdueTasks > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {member.workload.overdueTasks} overdue
                    </Badge>
                  )}
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
            
            {member.aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">AI Recommendations:</p>
                {member.aiSuggestions.map((suggestion, index) => (
                  <div key={index} className={`flex items-start gap-2 p-3 rounded-md ${getWorkloadBgColor(member.workload.workloadScore)}`}>
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSuggestionBadgeVariant(suggestion.priority)} className="text-xs">
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-xs">{suggestion.message}</p>
                      {suggestion.action && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          {suggestion.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
