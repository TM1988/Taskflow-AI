"use client";

import { useState, useEffect } from "react";
import DashboardMetrics from "@/components/dashboard/dashboard-metrics";
import RepositoryList from "@/components/dashboard/repository-list";
import AISuggestions from "@/components/dashboard/ai-suggestions";
import GitHubConnect from "@/components/github/GitHubConnect";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons";
import { Rocket } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  // Regular dashboard content for all users
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AISuggestions />
        <GitHubConnect />
      </div>

      <RepositoryList />

    </div>
  );
}
