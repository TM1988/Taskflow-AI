"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BurndownChart from "@/components/analytics/burndown-chart";
import VelocityChart from "@/components/analytics/velocity-chart";
import ContributionMetrics from "@/components/analytics/contribution-metrics";
import ProjectPerformance from "@/components/analytics/project-performance";
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2 } from "lucide-react";

// Metadata is client-side in this case
const pageTitle = "Analytics | TaskFlow-AI";
const pageDescription = "Personal analytics and performance metrics";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const { user } = useAuth();

  // Show content immediately for instant navigation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Simple loading state for user authentication
  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal Analytics</h1>
        <p className="text-muted-foreground">
          Track your personal task completion and productivity metrics
        </p>
      </div>

      {/* Overview with all analytics in one page */}
      <div className="space-y-6">
        {/* Contribution Metrics - Full width at top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contribution Metrics</CardTitle>
            <CardDescription>
              Your task completion and contribution analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContributionMetrics projectId="personal" />
          </CardContent>
        </Card>

        {/* Personal Performance with pie charts - Full width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Performance</CardTitle>
            <CardDescription>
              Your task metrics and productivity indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectPerformance projectId="personal" />
          </CardContent>
        </Card>

        {/* Personal Velocity - Full width at bottom */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Velocity</CardTitle>
            <CardDescription>
              Your task completion rate over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VelocityChart projectId="personal" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
