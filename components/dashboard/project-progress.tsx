// components/dashboard/project-progress.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#16a34a", "#3b82f6", "#ef4444", "#f59e0b"];

export default function ProjectProgress() {
  const [projectStats, setProjectStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // You'll need to implement this API endpoint
        const response = await fetch(`/api/dashboard/stats?userId=${user.uid}`);

        if (response.ok) {
          const data = await response.json();
          setProjectStats(data);
        }
      } catch (error) {
        console.error("Error fetching project stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectStats();
  }, [user]);

  // Example data - replace with your actual data from the API
  const statusData = [
    { name: "Done", value: projectStats?.tasksByStatus?.done || 0 },
    {
      name: "In Progress",
      value: projectStats?.tasksByStatus?.inProgress || 0,
    },
    { name: "To Do", value: projectStats?.tasksByStatus?.todo || 0 },
    { name: "Blocked", value: projectStats?.tasksByStatus?.blocked || 0 },
  ];

  const priorityData = [
    { name: "High", value: projectStats?.tasksByPriority?.high || 0 },
    { name: "Medium", value: projectStats?.tasksByPriority?.medium || 0 },
    { name: "Low", value: projectStats?.tasksByPriority?.low || 0 },
  ];

  const getCompletionPercentage = () => {
    if (!projectStats?.tasksByStatus) return 0;

    // Add type assertion to tell TypeScript these are numbers
    const values = Object.values(projectStats.tasksByStatus) as number[];

    // Now TypeScript knows we're working with an array of numbers
    const total = values.reduce((a: number, b: number) => a + b, 0);

    if (total === 0) return 0;
    return Math.round((projectStats.tasksByStatus.done / total) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Track your team&apos;s productivity</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>
              Track your team&apos;s productivity
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm font-medium">
                {getCompletionPercentage()}%
              </span>
            </div>
            <Progress value={getCompletionPercentage()} />
          </div>

          <Tabs defaultValue="status">
            <TabsList className="w-full">
              <TabsTrigger value="status" className="flex-1">
                Status
              </TabsTrigger>
              <TabsTrigger value="priority" className="flex-1">
                Priority
              </TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="priority" className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
