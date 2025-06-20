"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
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

        // Set first project as selected by default
        if (userProjects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(userProjects[0].id);
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
          Track project metrics and team performance
        </p>
      </div>

      {projects.length > 0 ? (
        <>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Select Project:</p>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="velocity">Velocity</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sprint Burndown</CardTitle>
                    <CardDescription>
                      Track remaining work in current sprint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BurndownChart projectId={selectedProjectId} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Velocity</CardTitle>
                    <CardDescription>
                      Story points completed per sprint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VelocityChart projectId={selectedProjectId} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                  <CardDescription>
                    Overall project metrics and health indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectPerformance projectId={selectedProjectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="velocity">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Velocity Analysis</CardTitle>
                  <CardDescription>
                    In-depth look at team velocity trends and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <VelocityChart
                    projectId={selectedProjectId}
                    height={450}
                    detailed
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contributions">
              <Card>
                <CardHeader>
                  <CardTitle>Contribution Metrics</CardTitle>
                  <CardDescription>
                    Individual and team contribution analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContributionMetrics projectId={selectedProjectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance Metrics</CardTitle>
                  <CardDescription>
                    Detailed project performance and risk analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectPerformance projectId={selectedProjectId} detailed />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                Create a project first to see analytics data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
