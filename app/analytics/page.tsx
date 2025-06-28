"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BurndownChart from "@/components/analytics/burndown-chart";
import VelocityChart from "@/components/analytics/velocity-chart";
import ContributionMetrics from "@/components/analytics/contribution-metrics";
import ProjectPerformance from "@/components/analytics/project-performance";
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Metadata is client-side in this case
const pageTitle = "Analytics | TaskFlow-AI";
const pageDescription = "Project analytics and performance metrics";

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("personal");
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false); // Add instant loading
  const { user } = useAuth();
  const { toast } = useToast();

  // Show content immediately for instant navigation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Use the API route instead of direct service call
        const response = await fetch(
          `/api/analytics/projects?userId=${user.uid}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status}`);
        }

        const userProjects = await response.json();
        setProjects(userProjects);

        // Set personal as default, or first project if user has projects
        if (!selectedProjectId || selectedProjectId === "") {
          if (userProjects.length > 0) {
            setSelectedProjectId("personal"); // Default to personal even if projects exist
          } else {
            setSelectedProjectId("personal"); // Personal workspace users
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, selectedProjectId, toast]);

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
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your personal tasks and project metrics
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">View Analytics For:</p>
        <Select
          value={selectedProjectId}
          onValueChange={setSelectedProjectId}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal Tasks</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview with all analytics in one page */}
      <div className="space-y-6">
        {/* Contribution Metrics - Full width at top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contribution Metrics</CardTitle>
            <CardDescription>
              {selectedProjectId === "personal"
                ? "Your task completion and contribution analysis"
                : "Individual and team contribution analysis"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContributionMetrics projectId={selectedProjectId} />
          </CardContent>
        </Card>

        {/* Personal Performance with pie charts - Full width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedProjectId === "personal" ? "Personal Performance" : "Project Performance"}
            </CardTitle>
            <CardDescription>
              {selectedProjectId === "personal"
                ? "Your task metrics and productivity indicators"
                : "Overall project metrics and health indicators"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectPerformance projectId={selectedProjectId} />
          </CardContent>
        </Card>

        {/* Personal Velocity - Full width at bottom */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedProjectId === "personal" ? "Personal Velocity" : "Team Velocity"}
            </CardTitle>
            <CardDescription>
              {selectedProjectId === "personal"
                ? "Your task completion rate over time"
                : "Story points completed per sprint"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VelocityChart projectId={selectedProjectId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
