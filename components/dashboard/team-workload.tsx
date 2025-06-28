'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

interface TeamWorkloadProps {
  projectId?: string;
}

interface TeamMemberData {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: string;
  taskCount: number;
  capacity: number;
  completedThisWeek: number;
  overdueTasks: number;
}

function TeamMember({ member, onClick }: { member: TeamMemberData; onClick: () => void }) {
  const workloadPercentage = Math.min(100, (member.taskCount / member.capacity) * 100);
  
  // Determine status based on workload
  let statusColor = "bg-green-500";
  if (workloadPercentage >= 90) {
    statusColor = "bg-red-500";
  } else if (workloadPercentage >= 75) {
    statusColor = "bg-yellow-500";
  }

  const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  return (
    <div 
      className="flex items-start gap-4 mb-4 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={member.photoURL || undefined} alt={member.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-sm">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.role}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{member.taskCount}/{member.capacity}</p>
            <div className={`h-2 w-2 rounded-full ${statusColor} ml-auto`}></div>
          </div>
        </div>
        <Progress 
          value={workloadPercentage} 
          className="h-2"
        />
        <div className="flex gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {member.completedThisWeek} completed
          </Badge>
          {member.overdueTasks > 0 && (
            <Badge variant="destructive" className="text-xs">
              {member.overdueTasks} overdue
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamWorkload({ projectId }: TeamWorkloadProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (projectId && projectId !== "personal") {
      fetchTeamWorkload();
    } else {
      setTeamMembers([]);
      setLoading(false);
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
      setError(null);
      
      // Fetch project members
      const membersResponse = await fetch(`/api/projects/${projectId}/members`);
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch project members');
      }
      
      const members = await membersResponse.json();
      
      // Fetch task workload for each member
      const workloadPromises = members.map(async (member: any) => {
        try {
          const workloadResponse = await fetch(
            `/api/analytics/member-workload?projectId=${projectId}&memberId=${member.id}`
          );
          
          if (workloadResponse.ok) {
            const workloadData = await workloadResponse.json();
            return {
              id: member.id,
              name: member.name,
              email: member.email,
              photoURL: member.photoURL,
              role: member.role,
              taskCount: workloadData.activeTasks || 0,
              capacity: workloadData.capacity || 10,
              completedThisWeek: workloadData.completedThisWeek || 0,
              overdueTasks: workloadData.overdueTasks || 0,
            };
          } else {
            // Fallback data if workload API fails
            return {
              id: member.id,
              name: member.name,
              email: member.email,
              photoURL: member.photoURL,
              role: member.role,
              taskCount: 0,
              capacity: 10,
              completedThisWeek: 0,
              overdueTasks: 0,
            };
          }
        } catch (error) {
          console.error(`Error fetching workload for member ${member.id}:`, error);
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            photoURL: member.photoURL,
            role: member.role,
            taskCount: 0,
            capacity: 10,
            completedThisWeek: 0,
            overdueTasks: 0,
          };
        }
      });
      
      const workloadData = await Promise.all(workloadPromises);
      setTeamMembers(workloadData);
      
    } catch (error) {
      console.error('Error fetching team workload:', error);
      setError('Failed to load team workload data');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (memberId: string) => {
    router.push(`/profile/${memberId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
          <CardDescription>Current task allocation across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
          <CardDescription>Current task allocation across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
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
          <CardTitle>Team Workload</CardTitle>
          <CardDescription>Current task allocation across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>This feature is only available in team projects</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
          <CardDescription>Current task allocation across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No team members found for this project</p>
            <p className="text-xs mt-1">Add team members in the project settings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>
          Current task allocation across {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="pr-4">
            {teamMembers.map((member) => (
              <TeamMember 
                key={member.id} 
                member={member}
                onClick={() => handleMemberClick(member.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
