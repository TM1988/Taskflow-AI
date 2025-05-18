"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface BurndownChartProps {
  height?: number;
  projectId?: string;
}

export default function BurndownChart({
  height = 300,
  projectId,
}: BurndownChartProps) {
  const [data, setData] = useState([
    { day: "Day 1", remaining: 95, ideal: 90 },
    { day: "Day 2", remaining: 85, ideal: 80 },
    { day: "Day 3", remaining: 82, ideal: 70 },
    { day: "Day 4", remaining: 70, ideal: 60 },
    { day: "Day 5", remaining: 65, ideal: 50 },
    { day: "Day 6", remaining: 55, ideal: 40 },
    { day: "Day 7", remaining: 50, ideal: 30 },
    { day: "Day 8", remaining: 45, ideal: 20 },
    { day: "Day 9", remaining: 25, ideal: 10 },
    { day: "Day 10", remaining: 10, ideal: 0 },
  ]);

  // You can fetch project-specific data here
  useEffect(() => {
    if (projectId) {
      // Fetch burndown data for the specific project
      // For now we're using mock data
      console.log(`Fetching burndown data for project: ${projectId}`);
    }
  }, [projectId]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--chart-1))"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--chart-1))"
              stopOpacity={0.2}
            />
          </linearGradient>
          <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--chart-3))"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--chart-3))"
              stopOpacity={0.2}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="day" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2 border text-xs">
                  <p className="font-medium">{label}</p>
                  <p className="text-[hsl(var(--chart-1))]">
                    Remaining: {payload[0].value}
                  </p>
                  <p className="text-[hsl(var(--chart-3))]">
                    Ideal: {payload[1].value}
                  </p>
                </Card>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="remaining"
          stroke="hsl(var(--chart-1))"
          fillOpacity={1}
          fill="url(#colorRemaining)"
          name="Remaining Work"
        />
        <Area
          type="monotone"
          dataKey="ideal"
          stroke="hsl(var(--chart-3))"
          fillOpacity={1}
          fill="url(#colorIdeal)"
          name="Ideal Burndown"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
