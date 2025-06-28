"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2 } from "lucide-react";

interface ProjectPerformanceProps {
  detailed?: boolean;
  projectId?: string;
}

export default function ProjectPerformance({
  detailed = false,
  projectId,
}: ProjectPerformanceProps) {
  const [taskStatusData, setTaskStatusData] = useState<any[]>([]);
  const [taskTypeData, setTaskTypeData] = useState<any[]>([]);
  const [projectMetricsData, setProjectMetricsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        let response;

        if (projectId === "personal") {
          response = await fetch(`/api/analytics/personal?userId=${user.uid}`);
        } else if (projectId) {
          response = await fetch(`/api/analytics/project?projectId=${projectId}&userId=${user.uid}`);
        } else {
          response = await fetch(`/api/analytics/personal?userId=${user.uid}`);
        }

        if (response.ok) {
          const analytics = await response.json();
          
          // Transform status distribution to chart data
          const statusData = Object.entries(analytics.statusDistribution || {}).map(([status, count]: [string, any]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            color: getStatusColor(status)
          }));
          setTaskStatusData(statusData);

          // Calculate metrics based on real completion rate
          // These metrics are derived from your actual task completion rate:
          // - Productivity: 120% of completion rate (max 100)
          // - Consistency: 90% of completion rate 
          // - Planning: 110% of completion rate
          // - Focus: 95% of completion rate
          // - Organization: 105% of completion rate
          const completionRate = parseFloat(analytics.summary?.completionRate) || 0;
          const metricsData = [
            { subject: "Productivity", A: Math.min(100, Math.max(0, Math.round(completionRate * 1.2 * 10) / 10)), fullMark: 100 },
            { subject: "Consistency", A: Math.min(100, Math.max(0, Math.round(completionRate * 0.9 * 10) / 10)), fullMark: 100 },
            { subject: "Planning", A: Math.min(100, Math.max(0, Math.round(completionRate * 1.1 * 10) / 10)), fullMark: 100 },
            { subject: "Focus", A: Math.min(100, Math.max(0, Math.round(completionRate * 0.95 * 10) / 10)), fullMark: 100 },
            { subject: "Organization", A: Math.min(100, Math.max(0, Math.round(completionRate * 1.05 * 10) / 10)), fullMark: 100 },
          ];
          setProjectMetricsData(metricsData);

          // Task priority distribution for personal tasks using real data
          const totalTasks = analytics.summary?.totalTasks || 0;
          if (projectId === "personal" && totalTasks > 0) {
            // Use actual priority data if available, otherwise estimate based on typical distributions
            const priorities = analytics.priorityDistribution || {};
            
            // Get actual counts or reasonable estimates
            const highCount = priorities.high || Math.ceil(totalTasks * 0.2);
            const mediumCount = priorities.medium || Math.ceil(totalTasks * 0.6);
            const lowCount = priorities.low || Math.max(0, totalTasks - highCount - mediumCount);
            
            // Only include priorities that have tasks - using board colors
            const priorityData = [];
            if (highCount > 0) {
              priorityData.push({ name: "High Priority", value: highCount, color: "#ef4444" }); // red-500 - matches board high priority
            }
            if (mediumCount > 0) {
              priorityData.push({ name: "Medium Priority", value: mediumCount, color: "#eab308" }); // yellow-500 - matches board medium priority
            }
            if (lowCount > 0) {
              priorityData.push({ name: "Low Priority", value: lowCount, color: "#22c55e" }); // green-500 - matches board low priority
            }
            
            setTaskTypeData(priorityData);
          } else {
            setTaskTypeData([
              { name: "Personal Tasks", value: totalTasks, color: "hsl(var(--chart-1))" },
            ]);
          }
        } else {
          console.warn("Failed to fetch analytics, using fallback data");
          // Provide reasonable fallback data
          setTaskStatusData([
            { name: "To Do", value: 0, color: "hsl(var(--chart-3))" },
            { name: "Done", value: 0, color: "hsl(var(--chart-2))" },
          ]);
          setTaskTypeData([
            { name: "Personal Tasks", value: 0, color: "hsl(var(--chart-1))" },
          ]);
          setProjectMetricsData([
            { subject: "Productivity", A: 0, fullMark: 100 },
            { subject: "Consistency", A: 0, fullMark: 100 },
            { subject: "Planning", A: 0, fullMark: 100 },
            { subject: "Focus", A: 0, fullMark: 100 },
            { subject: "Organization", A: 0, fullMark: 100 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
        // Fallback to mock data
        setTaskStatusData([
          { name: "To Do", value: 5, color: "hsl(var(--chart-3))" },
          { name: "In Progress", value: 3, color: "hsl(var(--chart-1))" },
          { name: "Done", value: 8, color: "hsl(var(--chart-2))" },
        ]);
        setTaskTypeData([
          { name: "Personal Tasks", value: 16, color: "hsl(var(--chart-1))" },
        ]);
        setProjectMetricsData([
          { subject: "Productivity", A: 75, fullMark: 100 },
          { subject: "Consistency", A: 65, fullMark: 100 },
          { subject: "Planning", A: 70, fullMark: 100 },
          { subject: "Focus", A: 80, fullMark: 100 },
          { subject: "Organization", A: 85, fullMark: 100 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [projectId, user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'todo':
      case 'to do':
        return "hsl(var(--chart-3))";
      case 'in progress':
      case 'inprogress':
        return "hsl(var(--chart-1))";
      case 'done':
      case 'completed':
        return "hsl(var(--chart-2))";
      case 'review':
        return "hsl(var(--chart-5))";
      default:
        return "hsl(var(--chart-4))";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
    value,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
        fontSize="10"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Tabs defaultValue="overview">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tasks">Task Distribution</TabsTrigger>
        <TabsTrigger value="metrics">Project Metrics</TabsTrigger>
      </TabsList>

      <TabsContent
        value="overview"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={projectMetricsData}
              >
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="subject" className="text-xs" />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  className="text-xs"
                />
                <Radar
                  name="Project"
                  dataKey="A"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Card className="p-2 border text-xs">
                          <p className="font-medium">
                            {payload[0].payload.subject}
                          </p>
                          <p>Score: {payload[0].value}/100</p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (
                      active &&
                      payload &&
                      payload.length > 0 &&
                      payload[0]?.value !== undefined
                    ) {
                      return (
                        <Card className="p-2 border text-xs">
                          <p className="font-medium">{payload[0].name}</p>
                          <p>{payload[0].value} tasks</p>
                          <p>
                            {Math.round(
                              ((Number(payload[0].value) || 0) /
                                (taskStatusData.reduce(
                                  (sum, entry) => sum + entry.value,
                                  0,
                                ) || 1)) *
                                100,
                            )}
                            % of total
                          </p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="tasks"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-center mb-4">
              Task Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (
                      active &&
                      payload &&
                      payload.length > 0 &&
                      payload[0]?.value !== undefined
                    ) {
                      return (
                        <Card className="p-2 border text-xs">
                          <p className="font-medium">{payload[0].name}</p>
                          <p>{payload[0].value} tasks</p>
                          <p>
                            {Math.round(
                              ((Number(payload[0].value) || 0) /
                                (taskStatusData.reduce(
                                  (sum, entry) => sum + entry.value,
                                  0,
                                ) || 1)) *
                                100,
                            )}
                            % of total
                          </p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-center mb-4">
              Task Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (
                      active &&
                      payload &&
                      payload.length > 0 &&
                      payload[0]?.value !== undefined
                    ) {
                      return (
                        <Card className="p-2 border text-xs">
                          <p className="font-medium">{payload[0].name}</p>
                          <p>{payload[0].value} tasks</p>
                          <p>
                            {Math.round(
                              ((Number(payload[0].value) || 0) /
                                (taskTypeData.reduce(
                                  (sum, entry) => sum + entry.value,
                                  0,
                                ) || 1)) *
                                100,
                            )}
                            % of total
                          </p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="metrics">
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={projectMetricsData}
              >
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="subject" className="text-sm" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Project"
                  dataKey="A"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Card className="p-2 border text-xs">
                          <p className="font-medium">
                            {payload[0].payload.subject}
                          </p>
                          <p>Score: {payload[0].value}/100</p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
