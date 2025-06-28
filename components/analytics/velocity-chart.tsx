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
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2 } from "lucide-react";

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
  const [basicData, setBasicData] = useState<any[]>([]);
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchVelocityData = async () => {
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
          const velocityData = (analytics.velocity || []).map((item: any, index: number) => ({
            ...item,
            week: `Week ${index + 1}`,
            completed: Math.round((item.completed || 0) * 10) / 10,
            created: Math.round((item.created || 0) * 10) / 10,
          }));
          setBasicData(velocityData);
          setDetailedData(velocityData);
        } else {
          // Fallback to mock data
          const mockBasic = [
            { week: "Week 1", completed: 0, created: 0 },
            { week: "Week 2", completed: 0, created: 0 },
            { week: "Week 3", completed: 0, created: 0 },
            { week: "Week 4", completed: 0, created: 0 },
          ];
          setBasicData(mockBasic);
          setDetailedData(mockBasic);
        }
      } catch (error) {
        console.error("Error fetching velocity data:", error);
        // Fallback to mock data
        const mockBasic = [
          { week: "Week 1", completed: 0, created: 0 },
          { week: "Week 2", completed: 0, created: 0 },
          { week: "Week 3", completed: 0, created: 0 },
          { week: "Week 4", completed: 0, created: 0 },
        ];
        setBasicData(mockBasic);
        setDetailedData(mockBasic);
      } finally {
        setLoading(false);
      }
    };

    fetchVelocityData();
  }, [projectId, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const data = detailed ? detailedData : basicData;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length > 0) {
              return (
                <Card className="p-2 border text-xs">
                  <p className="font-medium">{label}</p>
                  <p className="text-[hsl(var(--chart-1))]">
                    Completed: {payload[0]?.value} tasks
                  </p>
                  <p className="text-[hsl(var(--chart-3))]">
                    Created: {payload[1]?.value} tasks
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
          name="Completed Tasks"
          fill="hsl(var(--chart-1))"
        />
        <Bar 
          dataKey="created" 
          name="Created Tasks" 
          fill="hsl(var(--chart-3))" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
