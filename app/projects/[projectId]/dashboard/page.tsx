"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardMetrics from "@/components/dashboard/dashboard-metrics";
import RecentActivity from "@/components/dashboard/recent-activity";
import RepositoryList from "@/components/dashboard/repository-list";
import TeamWorkload from "@/components/dashboard/team-workload-ai";
import TimeTrackingWidget from "@/components/dashboard/time-tracking-widget";
import EnhancedAISuggestions from "@/components/dashboard/ai-suggestions-enhanced";
import DashboardZoomControl from "@/components/dashboard/dashboard-zoom-control";
import { useAuth } from "@/services/auth/AuthContext";

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Dashboard
          </h1>
          <p className="text-muted-foreground">
            Team insights and project management overview
          </p>
        </div>
        <DashboardZoomControl onZoomChange={setZoomLevel} />
      </div>

      {/* Dashboard content with zoom applied */}
      <div className="dashboard-zoom-wrapper overflow-hidden w-full">
        <div 
          className="dashboard-content space-y-6 min-h-0"
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out',
            marginBottom: zoomLevel < 1 ? `${(1 - zoomLevel) * 50}vh` : '0',
          }}
        >
          <DashboardMetrics projectId={projectId} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EnhancedAISuggestions projectId={projectId} isPersonal={false} />
            </div>
            <div>
              <TimeTrackingWidget projectId={projectId} />
            </div>
          </div>

          {/* Team Workload component */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamWorkload projectId={projectId} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
          </div>

          <RepositoryList />
        </div>
      </div>
    </div>
  );
}
