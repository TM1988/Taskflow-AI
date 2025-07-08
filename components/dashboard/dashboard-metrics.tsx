'use client';

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
} from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  Clock,
  ListChecks,
  Calendar,
  Target,
  TrendingUp,
  Zap,
  Info,
} from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useAuth } from "@/services/auth/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardMetricsProps {
  projectId?: string;
}

interface DashboardStats {
  activeTasks: number;
  completedThisWeek: number;
  totalTasks: number;
  focusTime: number; // in minutes
  streakDays: number;
  productivityScore: number;
  tasksCompletedToday: number;
  averageTaskCompletion: number; // in days
  teamSize?: number; // for project dashboards
  completionRate?: number; // for project dashboards
}

const metricIconVariants = cva(
  "rounded-md p-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-green-500/10 text-green-500",
        warning: "bg-yellow-500/10 text-yellow-500",
        danger: "bg-red-500/10 text-red-500",
        info: "bg-blue-500/10 text-blue-500",
        purple: "bg-purple-500/10 text-purple-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  info?: string;
  loading?: boolean;
}

function MetricCard({ title, value, change, trend, icon, variant = 'default', info, loading }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              {info && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{info}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="space-y-1">
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold">{value}</p>
              )}
              {change && !loading && (
                <div className={cn(
                  "text-xs",
                  trend === 'up' && "text-green-500",
                  trend === 'down' && "text-red-500",
                  trend === 'neutral' && "text-yellow-500"
                )}>
                  {change}
                </div>
              )}
            </div>
          </div>
          <div className={cn(metricIconVariants({ variant }))}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardMetrics({ projectId }: DashboardMetricsProps) {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Fetch organization ID for the project
  useEffect(() => {
    if (projectId) {
      const fetchProjectOrganization = async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          if (response.ok) {
            const project = await response.json();
            setOrganizationId(project.organizationId || null);
            console.log("[DASHBOARD METRICS] Project organization ID:", project.organizationId);
          }
        } catch (error) {
          console.error("[DASHBOARD METRICS] Error fetching project organization:", error);
        }
      };
      fetchProjectOrganization();
    }
  }, [projectId]);

  useEffect(() => {
    console.log('[DASHBOARD METRICS] Effect - user:', user?.uid, 'authLoading:', authLoading, 'organizationId:', organizationId);
    if (!authLoading && user?.uid) {
      // For personal dashboard, fetch immediately
      // For project dashboard, wait until we have organization ID (or confirmed there isn't one)
      if (!projectId || organizationId !== null) {
        console.log('[DASHBOARD METRICS] User found and auth loaded, fetching dashboard stats...');
        fetchDashboardStats();
      }
    } else if (!authLoading && !user?.uid) {
      console.log('No user found after auth loading complete');
      setLoading(false);
    } else {
      console.log('Still loading auth or no user');
    }
  }, [user?.uid, authLoading, organizationId]); // Added organizationId to dependencies

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      fetchDashboardStats();
    };

    window.addEventListener('taskCreated', handleTaskUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('taskCompleted', handleTaskUpdate);
    window.addEventListener('timeTrackingUpdated', handleTaskUpdate);

    return () => {
      window.removeEventListener('taskCreated', handleTaskUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('taskCompleted', handleTaskUpdate);
      window.removeEventListener('timeTrackingUpdated', handleTaskUpdate);
    };
  }, []);

  const fetchDashboardStats = async () => {
    if (!user?.uid) {
      console.log('No user ID available for fetching stats');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[DASHBOARD METRICS] Fetching dashboard stats for user:', user?.uid, 'project:', projectId, 'organization:', organizationId);
      
      let apiUrl = projectId 
        ? `/api/dashboard/project-stats?userId=${user?.uid}&projectId=${projectId}`
        : `/api/dashboard/personal-stats?userId=${user?.uid}`;
        
      // Add organization ID if available for project stats
      if (projectId && organizationId) {
        apiUrl += `&organizationId=${organizationId}`;
      }
        
      console.log('[DASHBOARD METRICS] API URL:', apiUrl);
      const response = await fetch(apiUrl);
      console.log('Dashboard stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard stats data:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Dashboard stats error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getCompletionTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'neutral' as const, change: 'No previous data' };
    const percentChange = ((current - previous) / previous) * 100;
    if (percentChange > 0) {
      return { trend: 'up' as const, change: `+${percentChange.toFixed(0)}% from last week` };
    } else if (percentChange < 0) {
      return { trend: 'down' as const, change: `${percentChange.toFixed(0)}% from last week` };
    }
    return { trend: 'neutral' as const, change: 'Same as last week' };
  };

  // Show loading state if auth is still loading or no stats yet
  const isLoading = authLoading || loading;
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={projectId ? "Project Tasks" : "Active Tasks"}
          value={isLoading ? "..." : stats?.activeTasks || 0}
          change={isLoading ? undefined : `${stats?.totalTasks || 0} total`}
          trend="neutral"
          icon={<ListChecks className="h-5 w-5" />}
          variant="info"
          info={projectId 
            ? "Active tasks in this project across all team members. Includes tasks in progress and pending." 
            : "Tasks currently in progress or pending. This includes tasks in 'To Do', 'In Progress', and 'Review' status."
          }
          loading={isLoading}
        />
        <MetricCard
          title={projectId ? "Team Completed" : "Completed This Week"}
          value={isLoading ? "..." : stats?.completedThisWeek || 0}
          change={isLoading ? undefined : projectId 
            ? `${stats?.completionRate || 0}% completion rate`
            : getCompletionTrend(stats?.completedThisWeek || 0, 5).change
          }
          trend={isLoading ? 'neutral' : getCompletionTrend(stats?.completedThisWeek || 0, 5).trend}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
          info={projectId
            ? "Tasks completed by all team members this week. Shows overall project progress and team productivity."
            : "Number of tasks marked as completed this week (Monday to Sunday). Helps track your weekly productivity."
          }
          loading={isLoading}
        />
        <MetricCard
          title={projectId ? "Team Activity" : "Daily Streak"}
          value={isLoading ? "..." : projectId ? `${stats?.streakDays || 0} days` : `${stats?.streakDays || 0} days`}
          change={isLoading ? undefined : projectId 
            ? `${stats?.teamSize || 0} team members`
            : `${stats?.tasksCompletedToday || 0} completed today`
          }
          trend="up"
          icon={<Zap className="h-5 w-5" />}
          variant="warning"
          info={projectId
            ? "Consecutive days with team activity on this project. Shows consistent project engagement across the team."
            : "Consecutive days you've completed at least one task. Maintains momentum and builds productive habits."
          }
          loading={isLoading}
        />
        <MetricCard
          title={projectId ? "Team Focus Time" : "Focus Time"}
          value={isLoading ? "..." : formatTime(stats?.focusTime || 0)}
          change={isLoading ? undefined : "this week"}
          trend="neutral"
          icon={<Clock className="h-5 w-5" />}
          variant="purple"
          info={projectId
            ? "Combined time all team members spent working on project tasks this week. Includes tracked time and manual entries."
            : "Time spent actively working on tasks this week. Tracked through task start/stop times and manual time entries."
          }
          loading={isLoading}
        />
      </div>
      </div>
    </TooltipProvider>
  );
}