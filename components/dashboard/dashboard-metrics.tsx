'use client';

import { 
  Card, 
  CardContent,
} from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  Clock,
  GitPullRequest,
  ListChecks,
} from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const metricIconVariants = cva(
  "rounded-md p-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-green-500/10 text-green-500",
        warning: "bg-yellow-500/10 text-yellow-500",
        danger: "bg-red-500/10 text-red-500",
        info: "bg-blue-500/10 text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

function MetricCard({ title, value, change, trend, icon, variant = 'default' }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <span className={cn(
                  "text-xs",
                  trend === 'up' && "text-green-500",
                  trend === 'down' && "text-red-500",
                  trend === 'neutral' && "text-yellow-500"
                )}>
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className={cn(metricIconVariants({ variant }))}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Open Tasks"
        value="24"
        change="+4% from last sprint"
        trend="up"
        icon={<ListChecks className="h-5 w-5" />}
        variant="info"
      />
      <MetricCard
        title="Completed Tasks"
        value="18"
        change="+12% from last sprint"
        trend="up"
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
      />
      <MetricCard
        title="Open PRs"
        value="7"
        change="-2 from yesterday"
        trend="down"
        icon={<GitPullRequest className="h-5 w-5" />}
        variant="warning"
      />
      <MetricCard
        title="Time Spent"
        value="32.5h"
        change="on track"
        trend="neutral"
        icon={<Clock className="h-5 w-5" />}
        variant="default"
      />
    </div>
  );
}