"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2, CheckCircle, Clock, Calendar } from "lucide-react";

interface ContributionMetricsProps {
  projectId?: string;
}

export default function ContributionMetrics({
  projectId,
}: ContributionMetricsProps) {
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchContributionData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        let response;

        if (projectId === "personal") {
          response = await fetch(`/api/analytics/personal?userId=${user.uid}`);
        } else {
          response = await fetch(`/api/analytics/project/${projectId}/contributions?userId=${user.uid}`);
        }

        if (response.ok) {
          const analytics = await response.json();
          // Round decimal values
          if (analytics.summary) {
            analytics.summary.completionRate = Math.round((analytics.summary.completionRate || 0) * 10) / 10;
            analytics.summary.avgCompletionTime = Math.round((analytics.summary.avgCompletionTime || 0) * 10) / 10;
          }
          setPersonalStats(analytics);
        } else {
          // Fallback to mock data for personal view
          setPersonalStats({
            summary: {
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
              completionRate: 0,
              overdueTasks: 0,
              avgCompletionTime: 0
            }
          });
        }
      } catch (error) {
        console.error("Error fetching contribution data:", error);
        // Fallback to empty data
        setPersonalStats({
          summary: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            completionRate: 0,
            overdueTasks: 0,
            avgCompletionTime: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContributionData();
  }, [projectId, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For personal workspace, show personal contribution metrics
  if (projectId === "personal" && personalStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                  <p className="text-lg font-semibold">{personalStats.summary.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasks Pending</p>
                  <p className="text-lg font-semibold">{personalStats.summary.pendingTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                  <p className="text-lg font-semibold">{personalStats.summary.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-500" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                  <p className="text-lg font-semibold">{personalStats.summary.overdueTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Productivity Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Task Completion Rate</span>
                  <span>{personalStats.summary.completionRate}%</span>
                </div>
                <Progress value={personalStats.summary.completionRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>On-Time Completion</span>
                  <span>{Math.max(0, 100 - (personalStats.summary.overdueTasks / personalStats.summary.totalTasks * 100)).toFixed(0)}%</span>
                </div>
                <Progress value={Math.max(0, 100 - (personalStats.summary.overdueTasks / personalStats.summary.totalTasks * 100))} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Average completion time: <span className="font-medium">{personalStats.summary.avgCompletionTime} days</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For project view, show team contributions (mock data)
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Team Contributions</h3>
        <p className="text-sm text-muted-foreground">
          Team contribution metrics are not yet implemented for project view.
        </p>
      </CardContent>
    </Card>
  );
}
