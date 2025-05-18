"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface VelocityChartProps {
  height?: number;
  detailed?: boolean;
  projectId?: string;
}

export default function VelocityChart({
  height = 300,
  detailed = false,
  projectId,
}: VelocityChartProps) {
  // Mock data for initial render
  const [basicData, setBasicData] = useState([
    { sprint: "Sprint 1", completed: 32, goal: 30 },
    { sprint: "Sprint 2", completed: 28, goal: 35 },
    { sprint: "Sprint 3", completed: 36, goal: 35 },
    { sprint: "Sprint 4", completed: 42, goal: 40 },
    { sprint: "Sprint 5", completed: 38, goal: 40 },
  ]);

  const [detailedData, setDetailedData] = useState([
    {
      sprint: "Sprint 1",
      completed: 32,
      goal: 30,
      features: 18,
      bugs: 8,
      technical: 6,
    },
    {
      sprint: "Sprint 2",
      completed: 28,
      goal: 35,
      features: 15,
      bugs: 10,
      technical: 3,
    },
    {
      sprint: "Sprint 3",
      completed: 36,
      goal: 35,
      features: 20,
      bugs: 7,
      technical: 9,
    },
    {
      sprint: "Sprint 4",
      completed: 42,
      goal: 40,
      features: 25,
      bugs: 10,
      technical: 12,
    },
  ]);

  // You can fetch project-specific data here
  useEffect(() => {
    if (projectId) {
      // Fetch velocity data for the specific project
      // For now we're using mock data
      console.log(`Fetching velocity data for project: ${projectId}`);
    }
  }, [projectId]);

  const data = detailed ? detailedData : basicData;

  return (
    <ResponsiveContainer width="100%" height={height}>
      {!detailed ? (
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="sprint" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length > 0) {
                return (
                  <Card className="p-2 border text-xs">
                    <p className="font-medium">{label}</p>
                    <p className="text-[hsl(var(--chart-1))]">
                      Completed: {payload[0]?.value} points
                    </p>
                    <p className="text-[hsl(var(--chart-3))]">
                      Goal: {payload[1]?.value} points
                    </p>
                  </Card>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar
            dataKey="completed"
            name="Completed Points"
            fill="hsl(var(--chart-1))"
          />
          <Bar dataKey="goal" name="Sprint Goal" fill="hsl(var(--chart-3))" />
        </BarChart>
      ) : (
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="sprint" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length > 0) {
                return (
                  <Card className="p-2 border text-xs">
                    <p className="font-medium">{label}</p>
                    <p className="text-[hsl(var(--chart-1))]">
                      Features: {payload[0]?.value} points
                    </p>
                    <p className="text-[hsl(var(--chart-2))]">
                      Bugs: {payload[1]?.value} points
                    </p>
                    <p className="text-[hsl(var(--chart-4))]">
                      Technical: {payload[2]?.value} points
                    </p>
                    <p className="text-[hsl(var(--chart-3))]">
                      Goal: {payload[3]?.value} points
                    </p>
                    <p className="font-medium pt-1 border-t mt-1">
                      Total:{" "}
                      {payload[0]?.value !== undefined &&
                      payload[1]?.value !== undefined &&
                      payload[2]?.value !== undefined
                        ? Number(payload[0].value) +
                          Number(payload[1].value) +
                          Number(payload[2].value)
                        : 0}{" "}
                      points
                    </p>
                  </Card>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar
            dataKey="features"
            name="Feature Work"
            stackId="a"
            fill="hsl(var(--chart-1))"
          />
          <Bar
            dataKey="bugs"
            name="Bug Fixes"
            stackId="a"
            fill="hsl(var(--chart-2))"
          />
          <Bar
            dataKey="technical"
            name="Technical Debt"
            stackId="a"
            fill="hsl(var(--chart-4))"
          />
          <Bar dataKey="goal" name="Sprint Goal" fill="hsl(var(--chart-3))" />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
