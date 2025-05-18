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

interface ContributionMetricsProps {
  projectId?: string;
}

export default function ContributionMetrics({
  projectId,
}: ContributionMetricsProps) {
  // Mock data for initial render
  const [commitData, setCommitData] = useState([
    {
      name: "Alice Chen",
      commits: 45,
      avatar: "https://i.pravatar.cc/150?img=1",
      initials: "AC",
    },
    {
      name: "Bob Smith",
      commits: 68,
      avatar: "https://i.pravatar.cc/150?img=2",
      initials: "BS",
    },
    {
      name: "Charlie Kim",
      commits: 32,
      avatar: "https://i.pravatar.cc/150?img=3",
      initials: "CK",
    },
    {
      name: "Diana Wong",
      commits: 28,
      avatar: "https://i.pravatar.cc/150?img=4",
      initials: "DW",
    },
    {
      name: "Ethan Davis",
      commits: 52,
      avatar: "https://i.pravatar.cc/150?img=5",
      initials: "ED",
    },
  ]);

  const [taskCompletionData, setTaskCompletionData] = useState([
    {
      name: "Alice Chen",
      completed: 18,
      assigned: 22,
      avatar: "https://i.pravatar.cc/150?img=1",
      initials: "AC",
    },
    {
      name: "Bob Smith",
      completed: 25,
      assigned: 28,
      avatar: "https://i.pravatar.cc/150?img=2",
      initials: "BS",
    },
    {
      name: "Charlie Kim",
      completed: 15,
      assigned: 18,
      avatar: "https://i.pravatar.cc/150?img=3",
      initials: "CK",
    },
    {
      name: "Diana Wong",
      completed: 12,
      assigned: 15,
      avatar: "https://i.pravatar.cc/150?img=4",
      initials: "DW",
    },
    {
      name: "Ethan Davis",
      completed: 20,
      assigned: 24,
      avatar: "https://i.pravatar.cc/150?img=5",
      initials: "ED",
    },
  ]);

  const [reviewData, setReviewData] = useState([
    {
      name: "Alice Chen",
      reviewed: 12,
      avatar: "https://i.pravatar.cc/150?img=1",
      initials: "AC",
    },
    {
      name: "Bob Smith",
      reviewed: 23,
      avatar: "https://i.pravatar.cc/150?img=2",
      initials: "BS",
    },
    {
      name: "Charlie Kim",
      reviewed: 8,
      avatar: "https://i.pravatar.cc/150?img=3",
      initials: "CK",
    },
    {
      name: "Diana Wong",
      reviewed: 5,
      avatar: "https://i.pravatar.cc/150?img=4",
      initials: "DW",
    },
    {
      name: "Ethan Davis",
      reviewed: 15,
      avatar: "https://i.pravatar.cc/150?img=5",
      initials: "ED",
    },
  ]);

  const [trendData, setTrendData] = useState([
    { week: "Week 1", team: 32, average: 6.4 },
    { week: "Week 2", team: 40, average: 8 },
    { week: "Week 3", team: 35, average: 7 },
    { week: "Week 4", team: 45, average: 9 },
    { week: "Week 5", team: 50, average: 10 },
    { week: "Week 6", team: 42, average: 8.4 },
  ]);

  // You can fetch project-specific data here
  useEffect(() => {
    if (projectId) {
      // Fetch contribution data for the specific project
      // For now we're using mock data
      console.log(`Fetching contribution data for project: ${projectId}`);
    }
  }, [projectId]);

  return (
    <Tabs defaultValue="commits">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="commits">Commits</TabsTrigger>
        <TabsTrigger value="tasks">Task Completion</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
      </TabsList>

      <TabsContent value="commits" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={commitData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Card className="p-2 border text-xs">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={payload[0].payload.avatar} />
                                <AvatarFallback>
                                  {payload[0].payload.initials}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium">
                                {payload[0].payload.name}
                              </p>
                            </div>
                            <p>Commits: {payload[0].value}</p>
                          </Card>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="commits"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 h-[332px] overflow-auto">
              <div className="space-y-4">
                {commitData.map((person, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-sm">{person.commits} commits</p>
                      </div>
                      <Progress
                        value={
                          (person.commits /
                            (Math.max(...commitData.map((d) => d.commits)) ||
                              1)) *
                          100
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={taskCompletionData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
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
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={payload[0].payload?.avatar} />
                                <AvatarFallback>
                                  {payload[0].payload?.initials}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium">
                                {payload[0].payload?.name}
                              </p>
                            </div>
                            <p>Commits: {payload[0].value}</p>
                          </Card>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="assigned"
                    fill="hsl(var(--chart-3))"
                    radius={[4, 4, 0, 0]}
                    opacity={0.5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 h-[332px] overflow-auto">
              <div className="space-y-4">
                {taskCompletionData.map((person, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-sm">
                          {person.completed}/{person.assigned} tasks
                        </p>
                      </div>
                      <Progress
                        value={(person.completed / person.assigned) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="trends">
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Card className="p-2 border text-xs">
                          <p className="font-medium">{label}</p>
                          <p className="text-[hsl(var(--chart-1))]">
                            Team Completed: {payload[0].value} tasks
                          </p>
                          <p className="text-[hsl(var(--chart-2))]">
                            Avg per Person: {payload[1].value} tasks
                          </p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="team"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Team Completed Tasks"
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Avg Tasks per Person"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
