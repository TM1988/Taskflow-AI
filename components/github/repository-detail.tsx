// components/github/repository-detail.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GitHubIcon } from "@/components/icons";
import {
  ExternalLink,
  GitFork,
  Star,
  AlertCircle,
  GitPullRequest,
  GitCommit,
} from "lucide-react";

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface PullRequest {
  id: number;
  title: string;
  number: number;
  state: "open" | "closed";
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
}

interface RepositoryDetailProps {
  repo: {
    id: string;
    name: string;
    fullName: string;
    description?: string;
    url: string;
    language?: string;
    stars?: number;
    forks?: number;
    issues?: number;
    private?: boolean;
  };
}

export default function RepositoryDetail({ repo }: RepositoryDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    commits: false,
    prs: false,
  });

  const loadCommits = async () => {
    if (commits.length > 0) return;

    setLoading((prev) => ({ ...prev, commits: true }));
    try {
      const response = await fetch(
        `/api/github/repositories/by-id/${repo.id}/commits`,
      );
      if (response.ok) {
        const data = await response.json();
        setCommits(data);
      }
    } catch (error) {
      console.error("Error fetching commits:", error);
    } finally {
      setLoading((prev) => ({ ...prev, commits: false }));
    }
  };

  const loadPullRequests = async () => {
    if (pullRequests.length > 0) return;

    setLoading((prev) => ({ ...prev, prs: true }));
    try {
      const response = await fetch(`/api/github/repositories/by-id/${repo.id}/pulls`);
      if (response.ok) {
        const data = await response.json();
        setPullRequests(data);
      }
    } catch (error) {
      console.error("Error fetching pull requests:", error);
    } finally {
      setLoading((prev) => ({ ...prev, prs: false }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === "commits") {
      loadCommits();
    } else if (value === "prs") {
      loadPullRequests();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitHubIcon className="h-5 w-5" />
              <CardTitle>{repo.name}</CardTitle>
              {repo.private && (
                <Badge variant="outline" className="ml-2">
                  Private
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {repo.description}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={repo.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>

        <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
          {repo.language && (
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{repo.stars || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            <span>{repo.forks || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>{repo.issues || 0} issues</span>
          </div>
        </div>
      </CardHeader>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="commits" className="flex-1">
              <GitCommit className="mr-1 h-4 w-4" />
              Commits
            </TabsTrigger>
            <TabsTrigger value="prs" className="flex-1">
              <GitPullRequest className="mr-1 h-4 w-4" />
              Pull Requests
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-4">
          <TabsContent value="overview" className="pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Repository Info</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Full name: {repo.fullName}</li>
                    <li>
                      Primary language: {repo.language || "Not specified"}
                    </li>
                    <li>Stars: {repo.stars || 0}</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Task Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect this repository to tasks by mentioning the task ID
                    in your commit messages.
                  </p>
                  <Button size="sm" variant="secondary">
                    Link to Project
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commits">
            {loading.commits ? (
              <div className="flex justify-center py-8">Loading commits...</div>
            ) : commits.length > 0 ? (
              <div className="space-y-2">
                {commits.slice(0, 5).map((commit) => (
                  <div key={commit.sha} className="p-3 border rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium line-clamp-1">
                        {commit.commit.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(
                          commit.commit.author.date,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      By {commit.commit.author.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No commits found for this repository.
              </div>
            )}
          </TabsContent>

          <TabsContent value="prs">
            {loading.prs ? (
              <div className="flex justify-center py-8">
                Loading pull requests...
              </div>
            ) : pullRequests.length > 0 ? (
              <div className="space-y-2">
                {pullRequests.slice(0, 5).map((pr) => (
                  <div key={pr.id} className="p-3 border rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium line-clamp-1">
                        #{pr.number}: {pr.title}
                      </div>
                      <Badge
                        variant={pr.state === "open" ? "default" : "secondary"}
                      >
                        {pr.state}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Opened by {pr.user.login} on{" "}
                      {new Date(pr.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pull requests found for this repository.
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="border-t pt-4">
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          <span>Last updated: {new Date().toLocaleDateString()}</span>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`${repo.url}/issues`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View issues
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
