'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProjectHealthProps {
  projectId?: string;
}

interface HealthItemProps {
  label: string;
  status: 'on-track' | 'at-risk' | 'behind';
  value: number;
}

function HealthItem({ label, status, value }: HealthItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn(
          "text-xs font-medium",
          status === 'on-track' && "text-green-500 dark:text-green-400",
          status === 'at-risk' && "text-yellow-500 dark:text-yellow-400",
          status === 'behind' && "text-red-500 dark:text-red-400",
        )}>
          {status === 'on-track' && 'On Track'}
          {status === 'at-risk' && 'At Risk'}
          {status === 'behind' && 'Behind'}
        </span>
      </div>
      <Progress 
        value={value} 
        className={cn(
          status === 'on-track' && "bg-green-100 dark:bg-green-900/20",
          status === 'at-risk' && "bg-yellow-100 dark:bg-yellow-900/20",
          status === 'behind' && "bg-red-100 dark:bg-red-900/20",
        )}
        indicatorClassName={cn(
          status === 'on-track' && "bg-green-500",
          status === 'at-risk' && "bg-yellow-500",
          status === 'behind' && "bg-red-500",
        )}
      />
    </div>
  );
}

export default function ProjectHealth({ projectId }: ProjectHealthProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Health</CardTitle>
        <CardDescription>
          Current status across key metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <HealthItem
          label="Sprint Progress"
          status="on-track"
          value={75}
        />
        <HealthItem
          label="Bug Resolution"
          status="at-risk"
          value={58}
        />
        <HealthItem
          label="Code Reviews"
          status="behind"
          value={32}
        />
        <HealthItem
          label="Documentation"
          status="on-track"
          value={85}
        />
        <HealthItem
          label="Test Coverage"
          status="at-risk"
          value={62}
        />
      </CardContent>
    </Card>
  );
}