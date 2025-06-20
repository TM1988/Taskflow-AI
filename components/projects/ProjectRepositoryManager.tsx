"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, AlertCircle, Check, Plus, Minus } from "lucide-react";
import GitHubConnect from "@/components/github/GitHubConnect";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  html_url: string;
}

interface ProjectRepositoryManagerProps {
  projectId: string;
  organizationId?: string;
}

export default function ProjectRepositoryManager({ 
  projectId, 
  organizationId 
}: ProjectRepositoryManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<number[]>([]);
  const [originalSelectedRepos, setOriginalSelectedRepos] = useState<number[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkGitHubConnectionAndLoadData();
  }, [projectId]);

  // Listen for GitHub connection events
  useEffect(() => {
    const handleGitHubConnected = (event: CustomEvent) => {
      console.log("🔄 ProjectRepositoryManager: GitHub connected event received:", event.detail);
      // Refresh the connection status and data
      checkGitHubConnectionAndLoadData();
    };

    window.addEventListener('githubConnected', handleGitHubConnected as EventListener);
    
    return () => {
      window.removeEventListener('githubConnected', handleGitHubConnected as EventListener);
    };
  }, [projectId]);

  const checkGitHubConnectionAndLoadData = async () => {
    try {
      setLoading(true);

      // Check if project has GitHub connected (using project context)
      const user = (window as any).firebase?.auth()?.currentUser;
      if (!user) {
        console.log('No authenticated user found');
        setGithubConnected(false);
        return;
      }

      const token = await user.getIdToken(true); // Force token refresh
      console.log('Checking project-level GitHub connection for project:', projectId);
      
      const statusResponse = await fetch(
        `/api/github/connection-status?userId=${user.uid}&context=project&projectId=${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!statusResponse.ok) {
        console.log('Project GitHub status check failed:', statusResponse.status);
        setGithubConnected(false);
        return;
      }

      const statusData = await statusResponse.json();
      console.log('Project GitHub status:', statusData);
      setGithubConnected(statusData.isConnected);

      if (statusData.isConnected) {
        // Load available repositories using the user's GitHub token
        const reposResponse = await fetch(
          `/api/github/repositories?userId=${user.uid}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (reposResponse.ok) {
          const reposData = await reposResponse.json();
          setRepositories(reposData || []);
        }

        // Load current project repository assignments
        const assignmentsResponse = await fetch(
          `/api/projects/${projectId}/repositories`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          const repoIds = assignmentsData.repositories?.map((repo: Repository) => repo.id) || [];
          setSelectedRepos(repoIds);
          setOriginalSelectedRepos(repoIds);
        }
      }
    } catch (error) {
      console.error("Error loading repository data:", error);
      toast({
        title: "Error",
        description: "Failed to load repository data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRepoToggle = (repoId: number) => {
    setSelectedRepos(prev => 
      prev.includes(repoId) 
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const selectedRepositories = repositories.filter(repo => 
        selectedRepos.includes(repo.id)
      );

      const response = await fetch(`/api/projects/${projectId}/repositories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositories: selectedRepositories,
        }),
      });

      if (response.ok) {
        setOriginalSelectedRepos([...selectedRepos]);
        toast({
          title: "Success",
          description: "Repository access updated successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update repository access");
      }
    } catch (error) {
      console.error("Error saving repository access:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update repository access",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(selectedRepos.sort()) !== JSON.stringify(originalSelectedRepos.sort());
  };

  if (!organizationId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This project is not part of an organization. Repository access is only available for organization projects.
          To use this feature, create your project within an organization that has GitHub connected.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading repository data...</span>
      </div>
    );
  }

  if (!githubConnected) {
    return (
      <div className="space-y-6">
        <Alert>
          <Github className="h-4 w-4" />
          <AlertDescription>
            Connect GitHub to access and assign repositories to this project.
          </AlertDescription>
        </Alert>
        
        <GitHubConnect 
          projectId={projectId}
          context="project"
          showImporter={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Select which repositories this project can access from your GitHub connection.
          </p>
        </div>
        {hasChanges() && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      {repositories.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No repositories found. Make sure your GitHub connection has access to repositories.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {repositories.map((repo) => (
            <Card key={repo.id} className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={`repo-${repo.id}`}
                  checked={selectedRepos.includes(repo.id)}
                  onCheckedChange={() => handleRepoToggle(repo.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <label
                      htmlFor={`repo-${repo.id}`}
                      className="font-medium cursor-pointer hover:text-primary"
                    >
                      {repo.name}
                    </label>
                    {repo.private && (
                      <Badge variant="secondary" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {repo.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {repo.full_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedRepos.includes(repo.id) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          Selected {selectedRepos.length} of {repositories.length} repositories.
          Tasks in this project will be able to access and sync with the selected repositories.
        </p>
      </div>
    </div>
  );
}
