"use client";

import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import { useAuth } from '@/services/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectPerformance from '@/components/analytics/project-performance';
import VelocityChart from '@/components/analytics/velocity-chart';
import BurndownChart from '@/components/analytics/burndown-chart';
import TeamContributionMetrics from '@/components/analytics/team-contribution-metrics';

interface ProjectAnalyticsData {
  teamMetrics: {
    totalMembers: number;
    activeMembers: number;
    avgTasksPerMember: number;
    topContributor: string;
  };
  projectProgress: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
  };
  timeTracking: {
    totalHours: number;
    avgHoursPerMember: number;
    mostActiveDay: string;
  };
  velocity: {
    currentWeekCompleted: number;
    previousWeekCompleted: number;
    weeklyTrend: 'up' | 'down' | 'neutral';
  };
}

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ProjectAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const projectId = params.projectId as string;

  useEffect(() => {
    if (user?.uid && projectId) {
      fetchProjectAnalytics();
    }
  }, [user?.uid, projectId]);

  const fetchProjectAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/project?projectId=${projectId}&userId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching project analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Analytics</h1>
        <p className="text-muted-foreground">
          Team performance insights and project progress metrics
        </p>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Team Size</p>
              <p className="text-2xl font-bold">{analytics?.teamMetrics.totalMembers || 0}</p>
              <p className="text-xs text-muted-foreground">
                {analytics?.teamMetrics.activeMembers || 0} active this week
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{analytics?.projectProgress.completionRate.toFixed(1) || 0}%</p>
              <p className="text-xs text-muted-foreground">
                {analytics?.projectProgress.completedTasks || 0} of {analytics?.projectProgress.totalTasks || 0} tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold">{analytics?.timeTracking.totalHours.toFixed(1) || 0}h</p>
              <p className="text-xs text-muted-foreground">
                {analytics?.timeTracking.avgHoursPerMember.toFixed(1) || 0}h avg per member
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Weekly Velocity</p>
              <p className="text-2xl font-bold">{analytics?.velocity.currentWeekCompleted || 0}</p>
              <p className="text-xs text-muted-foreground">
                {analytics?.velocity.previousWeekCompleted || 0} last week
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Contribution Metrics */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Team Contribution</h2>
          <p className="text-sm text-muted-foreground">
            Individual team member performance and contributions
          </p>
        </div>
        <TeamContributionMetrics projectId={projectId} />
      </section>

      {/* Project Performance */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Project Performance</h2>
          <p className="text-sm text-muted-foreground">
            Overall project health and key performance indicators
          </p>
        </div>
        <ProjectPerformance projectId={projectId} />
      </section>

      {/* Project Velocity & Burndown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Team Velocity</h2>
            <p className="text-sm text-muted-foreground">
              Weekly task completion trends across the team
            </p>
          </div>
          <VelocityChart projectId={projectId} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Project Burndown</h2>
            <p className="text-sm text-muted-foreground">
              Progress toward project completion over time
            </p>
          </div>
          <BurndownChart projectId={projectId} />
        </section>
      </div>
    </div>
  );
}
