"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  id: string;
  name: string;
  fullName?: string;
  full_name?: string; // GitHub API uses snake_case
  description?: string;
  language?: string;
  stars?: number;
  stargazers_count?: number; // GitHub API property
  issues?: number;
  open_issues_count?: number; // GitHub API property
  forks?: number;
  forks_count?: number; // GitHub API property
  updatedAt?: string;
  updated_at?: string; // GitHub API property
}

export default function RepositoryList() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/github/repositories?userId=${user.uid}`,
        );

        // Log response for debugging
        console.log(`Repository API response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`Fetched ${data.length} repositories`);

          // Normalize the data
          setRepositories(
            data.map((repo: any) => ({
              id: repo.id?.toString() || `repo-${Math.random()}`,
              name: repo.name,
              fullName: repo.full_name || repo.fullName,
              description: repo.description || "",
              language: repo.language || "Unknown",
              stars: repo.stargazers_count || repo.stars || 0,
              issues: repo.open_issues_count || repo.issues || 0,
              forks: repo.forks_count || repo.forks || 0,
              updatedAt: repo.updated_at
                ? `Updated ${new Date(repo.updated_at).toLocaleDateString()}`
                : "Updated recently",
            })),
          );
        } else {
          // Parse error details
          const errorData = await response.json();
          console.error("Repository API error:", errorData);

          // Show error in UI (optional)
          toast({
            title: "Error fetching repositories",
            description:
              errorData.error || "Could not retrieve GitHub repositories",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching repositories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [user, toast]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>
            Linked GitHub repositories for your projects
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>
            Linked GitHub repositories for your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-10">
            No repositories connected yet. Connect GitHub to see your
            repositories.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Repositories</CardTitle>
        <CardDescription>
          Linked GitHub repositories for your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 py-3 border-b last:border-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <GitHubIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{repo.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {repo.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                  <span>{repo.language}</span>
                </div>
                <span>⭐ {repo.stars}</span>
                <span>🔄 {repo.issues}</span>
                <span className="text-xs">{repo.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
