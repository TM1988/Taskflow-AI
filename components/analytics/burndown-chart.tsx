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
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2 } from "lucide-react";

interface BurndownChartProps {
  height?: number;
  projectId?: string;
}

export default function BurndownChart({
  height = 300,
  projectId,
}: BurndownChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBurndownData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        let response;

        if (projectId === "personal") {
          // Fetch personal analytics
          response = await fetch(`/api/analytics/personal?userId=${user.uid}`);
        } else if (projectId) {
          // Fetch project analytics
          response = await fetch(`/api/analytics/project?projectId=${projectId}&userId=${user.uid}`);
        } else {
          // Default to personal analytics
          response = await fetch(`/api/analytics/personal?userId=${user.uid}`);
        }

        if (response.ok) {
          const analytics = await response.json();
          const burndownData = (analytics.burndown || []).map((item: any) => ({
            ...item,
            remaining: Math.round((item.remaining || 0) * 10) / 10,
            ideal: Math.round((item.ideal || 0) * 10) / 10,
            completed: Math.round((item.completed || 0) * 10) / 10,
          }));
          setData(burndownData);
        } else {
          // Fallback to empty data if API fails
          setData([
            { day: "Mon", remaining: 0, ideal: 0, completed: 0 },
            { day: "Tue", remaining: 0, ideal: 0, completed: 0 },
            { day: "Wed", remaining: 0, ideal: 0, completed: 0 },
            { day: "Thu", remaining: 0, ideal: 0, completed: 0 },
            { day: "Fri", remaining: 0, ideal: 0, completed: 0 },
            { day: "Sat", remaining: 0, ideal: 0, completed: 0 },
            { day: "Sun", remaining: 0, ideal: 0, completed: 0 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching burndown data:", error);
        // Fallback to empty data
        setData([
          { day: "Mon", remaining: 0, ideal: 0, completed: 0 },
          { day: "Tue", remaining: 0, ideal: 0, completed: 0 },
          { day: "Wed", remaining: 0, ideal: 0, completed: 0 },
          { day: "Thu", remaining: 0, ideal: 0, completed: 0 },
          { day: "Fri", remaining: 0, ideal: 0, completed: 0 },
          { day: "Sat", remaining: 0, ideal: 0, completed: 0 },
          { day: "Sun", remaining: 0, ideal: 0, completed: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBurndownData();
  }, [projectId, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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
