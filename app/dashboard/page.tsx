"use client";

import DashboardMetrics from "@/components/dashboard/dashboard-metrics";
import RepositoryList from "@/components/dashboard/repository-list";
import RecentActivity from "@/components/dashboard/recent-activity";
import TimeTrackingWidget from "@/components/dashboard/time-tracking-widget";
import EnhancedAISuggestions from "@/components/dashboard/ai-suggestions-enhanced";
import { useAuth } from "@/services/auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EnhancedAISuggestions isPersonal={true} />
        </div>
        <div className="space-y-6">
          <TimeTrackingWidget />
        </div>
      </div>

      <RecentActivity />

      <RepositoryList />
    </div>
  );
}
