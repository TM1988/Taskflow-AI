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

interface ProjectPerformanceProps {
  detailed?: boolean;
  projectId?: string;
}

export default function ProjectPerformance({
  detailed = false,
  projectId,
}: ProjectPerformanceProps) {
  // Mock data for project performance metrics
  const [taskStatusData, setTaskStatusData] = useState([
    { name: "To Do", value: 15, color: "hsl(var(--chart-3))" },
    { name: "In Progress", value: 10, color: "hsl(var(--chart-1))" },
    { name: "Review", value: 7, color: "hsl(var(--chart-5))" },
    { name: "Done", value: 18, color: "hsl(var(--chart-2))" },
  ]);

  const [taskTypeData, setTaskTypeData] = useState([
    { name: "Feature", value: 22, color: "hsl(var(--chart-2))" },
    { name: "Bug", value: 15, color: "hsl(var(--chart-5))" },
    { name: "Technical Debt", value: 8, color: "hsl(var(--chart-4))" },
    { name: "Documentation", value: 5, color: "hsl(var(--chart-1))" },
  ]);

  const [projectMetricsData, setProjectMetricsData] = useState([
    { subject: "Velocity", A: 80, fullMark: 100 },
    { subject: "Code Quality", A: 75, fullMark: 100 },
    { subject: "Testing", A: 65, fullMark: 100 },
    { subject: "Delivery", A: 85, fullMark: 100 },
    { subject: "Collaboration", A: 90, fullMark: 100 },
    { subject: "Documentation", A: 60, fullMark: 100 },
  ]);

  // You can fetch project-specific data here
  useEffect(() => {
    if (projectId) {
      // Fetch performance data for the specific project
      // For now we're using mock data
      console.log(
        `Fetching project performance data for project: ${projectId}`,
      );
    }
  }, [projectId]);

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
