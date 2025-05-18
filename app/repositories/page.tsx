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
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons";
import {
  Plus,
  Star,
  GitBranch,
  AlertCircle,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Remove any direct imports of Octokit or other Node.js specific libraries

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Use your API endpoint - no direct Octokit usage
        const response = await fetch(
          `/api/github/repositories?userId=${user.uid}`,
        );

        if (response.ok) {
          const data = await response.json();

          // Normalize data
          const normalizedRepos = data.map((repo: any) => ({
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
            status: "active",
            url: repo.html_url || "",
          }));

          setRepositories(normalizedRepos);
          setFilteredRepositories(normalizedRepos);
          setAvailableRepos(normalizedRepos);
        }

        // Fetch projects through your API
        const projectsResponse = await fetch(
          `/api/projects?userId=${user.uid}`,
        );
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }
      } catch (error) {
        console.error("Error fetching repositories:", error);
        toast({
          title: "Error",
          description:
            "Failed to load repositories. Make sure your GitHub account is connected.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [user, toast]);

  // Filter repositories when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredRepositories(repositories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description.toLowerCase().includes(query) ||
        repo.language.toLowerCase().includes(query),
    );

    setFilteredRepositories(filtered);
  }, [searchQuery, repositories]);

  const handleAddRepository = async () => {
    if (!selectedProject || !selectedRepo) return;

    try {
      setLoading(true);

      // Find the selected repository
      const repo = availableRepos.find((r) => r.id === selectedRepo);
      if (!repo) return;

      // Connect repository to project using your API
      const response = await fetch("/api/github/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          projectId: selectedProject,
          fullName: repo.fullName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Repository ${repo.name} connected to project successfully`,
        });

        setAddDialogOpen(false);

        // Refresh repositories list
        const response = await fetch(
          `/api/github/repositories?userId=${user?.uid}`,
        );
        if (response.ok) {
          const data = await response.json();
          setRepositories(data);
          setFilteredRepositories(data);
        }
      } else {
        throw new Error("Failed to connect repository");
      }
    } catch (error) {
      console.error("Error connecting repository:", error);
      toast({
        title: "Error",
        description: "Failed to connect repository to project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Rest of your component remains the same...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage and monitor your GitHub repositories
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Repository
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRepositories.length > 0 ? (
          filteredRepositories.map((repo, index) => (
            <Card key={index} className="hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitHubIcon className="h-4 w-4" />
                    <CardTitle>{repo.name}</CardTitle>
                    <Badge
                      variant={
                        repo.status === "active" ? "default" : "secondary"
                      }
                    >
                      {repo.status}
                    </Badge>
                  </div>
                  <CardDescription>{repo.description}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto flex"
                  asChild
                >
                  <a href={repo.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-primary"></span>
                    {repo.language}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {repo.stars}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-4 w-4" />
                    {repo.forks}
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {repo.issues} issues
                  </div>
                  <span>{repo.updatedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                No repositories found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No repositories match your search"
                  : "Connect GitHub to manage repositories"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Repository
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Repository to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Repository</label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent>
                  {availableRepos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRepository}
              disabled={!selectedProject || !selectedRepo}
            >
              Add Repository
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
