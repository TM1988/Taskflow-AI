"use client";

import DashboardMetrics from "@/components/dashboard/dashboard-metrics";
import RecentActivity from "@/components/dashboard/recent-activity";
import ProjectHealth from "@/components/dashboard/project-health";
import RepositoryList from "@/components/dashboard/repository-list";
import AISuggestions from "@/components/dashboard/ai-suggestions";
import TeamWorkload from "@/components/dashboard/team-workload";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons";

export default function ProjectDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your AI-powered project insights and management overview
          </p>
        </div>
      </div>

      <DashboardMetrics />

      <div className="grid grid-cols-1 gap-6">
        <AISuggestions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <TeamWorkload />
        </div>
      </div>

      <ProjectHealth />
      <RepositoryList />
    </div>
  );
}
