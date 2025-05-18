"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, GitBranch, Star } from "lucide-react";

const projects = [
  {
    name: "TaskFlow-AI",
    description: "AI-powered project management platform",
    progress: 75,
    members: 5,
    stars: 120,
    forks: 35,
    status: "active",
  },
  {
    name: "E-commerce Platform",
    description: "Modern e-commerce solution with AI recommendations",
    progress: 45,
    members: 3,
    stars: 85,
    forks: 20,
    status: "in-progress",
  },
  {
    name: "Analytics Dashboard",
    description: "Real-time analytics and reporting system",
    progress: 90,
    members: 4,
    stars: 95,
    forks: 25,
    status: "completed",
  },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor your projects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((project, i) => (
          <Card key={i} className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.description}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    project.status === "active"
                      ? "default"
                      : project.status === "completed"
                        ? "default"
                        : "secondary"
                  }
                >
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {project.members} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {project.stars}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-4 w-4" />
                    {project.forks} forks
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
