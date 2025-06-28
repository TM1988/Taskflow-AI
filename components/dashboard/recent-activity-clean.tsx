"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
  Target
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Task } from "@/types/task";

interface RecentActivityProps {
  projectId?: string;
}

export default function RecentActivity({ projectId }: RecentActivityProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
    }
  }, [user]);

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      fetchRecentActivity();
    };

    window.addEventListener('taskCreated', handleTaskUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('taskCompleted', handleTaskUpdate);

    return () => {
      window.removeEventListener('taskCreated', handleTaskUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('taskCompleted', handleTaskUpdate);
    };
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch recent tasks from personal database
      const response = await fetch(`/api/tasks?userId=${user?.uid}&personal=true&limit=20`);
      if (response.ok) {
        const allTasks = await response.json();
        
        // Recent completed tasks (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recent = allTasks
          .filter((task: Task) => task.status === 'done' || task.status === 'completed')
          .filter((task: Task) => {
            if (!task.completedAt && !task.updatedAt) return false;
            const dateToCheck = task.completedAt || task.updatedAt;
            if (!dateToCheck) return false;
            const completedDate = new Date(dateToCheck);
            return completedDate >= weekAgo;
          })
          .sort((a: Task, b: Task) => {
            const dateA = new Date(a.completedAt || a.updatedAt || 0).getTime();
            const dateB = new Date(b.completedAt || b.updatedAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);

        // Upcoming tasks (next 7 days)
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        
        const upcoming = allTasks
          .filter((task: Task) => task.status !== 'done' && task.status !== 'completed')
          .filter((task: Task) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= weekFromNow;
          })
          .sort((a: Task, b: Task) => {
            const dateA = new Date(a.dueDate || '').getTime();
            const dateB = new Date(b.dueDate || '').getTime();
            return dateA - dateB;
          })
          .slice(0, 5);

        setRecentTasks(recent);
        setUpcomingTasks(upcoming);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed': return 'text-green-500';
      case 'in-progress': return 'text-blue-500';
      case 'review': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const isOverdue = (dueDate: string | Date) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Completed Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recent Achievements
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No completed tasks this week</p>
              <p className="text-sm">Complete some tasks to see them here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                      {task.completedAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Coming Up
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming deadlines</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  {isOverdue(task.dueDate!) ? (
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue(task.dueDate) ? 'Overdue • ' : ''}{formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
