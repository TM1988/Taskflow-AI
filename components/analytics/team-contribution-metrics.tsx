'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/services/auth/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  tasksCompleted: number;
  totalTasks: number;
  hoursWorked: number;
  completionRate: number;
  isActive: boolean;
}

interface TeamContributionMetricsProps {
  projectId: string;
}

export default function TeamContributionMetrics({ projectId }: TeamContributionMetricsProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && projectId) {
      fetchTeamContributions();
    }
  }, [user?.uid, projectId]);

  const fetchTeamContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/team-contributions?projectId=${projectId}&userId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.teamMembers || []);
      }
    } catch (error) {
      console.error('Error fetching team contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-2 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Contributions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Individual performance and task completion rates
        </p>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No team member data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        {member.isActive && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{member.completionRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {member.tasksCompleted}/{member.totalTasks} tasks
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion</span>
                    <span>{member.tasksCompleted} tasks</span>
                  </div>
                  <Progress value={member.completionRate} className="h-2" />
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Hours Worked</span>
                  <span>{member.hoursWorked.toFixed(1)}h this week</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
