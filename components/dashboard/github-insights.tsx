'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, GitCommit, GitPullRequest, AlertCircle, TrendingUp, Users, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/services/auth/AuthContext";

interface Repository {
  id: string;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
}

interface RepositoryWithStats extends Repository {
  commitCount?: number;
  pullRequestCount?: number;
  aiSuggestions?: AISuggestion[];
}

interface AISuggestion {
  id: string;
  type: 'high' | 'medium' | 'low';
  category: 'performance' | 'collaboration' | 'maintenance' | 'quality';
  title: string;
  description: string;
  actionable: boolean;
}

interface GitHubInsightsProps {
  projectId?: string;
}

export default function GitHubInsights({ projectId }: GitHubInsightsProps) {
  const [repositories, setRepositories] = useState<RepositoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      fetchRepositoryInsights();
    }
  }, [user?.uid]);

  const fetchRepositoryInsights = async () => {
    if (!user?.uid || loading || retrying) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add a small delay to ensure user authentication is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch imported repositories
      const reposResponse = await fetch(`/api/github/repositories?userId=${user.uid}&context=personal`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('GitHub repos response status:', reposResponse.status);
      
      if (!reposResponse.ok) {
        const errorText = await reposResponse.text();
        console.log('GitHub repos error:', errorText);
        
        if (reposResponse.status === 401) {
          setError('GitHub not connected. Connect your GitHub account to see insights.');
          return;
        }
        if (reposResponse.status === 400) {
          setError('Invalid request. Please try refreshing the page.');
          return;
        }
        throw new Error(`Failed to fetch repositories (${reposResponse.status}): ${errorText}`);
      }
      
      const reposData = await reposResponse.json();
      console.log('GitHub repos data:', reposData);
      
      if (!reposData.success) {
        setError(reposData.error || 'Failed to fetch repositories');
        return;
      }
      
      if (reposData.repositories && reposData.repositories.length > 0) {
        // Get detailed insights for first 3 repositories
        const repositoriesWithStats = await Promise.all(
          reposData.repositories.slice(0, 3).map(async (repo: Repository) => {
            try {
              // Get repository details with stats
              const detailsResponse = await fetch(`/api/github/repositories/${repo.owner.login}/${repo.name}`);
              const commitsResponse = await fetch(`/api/github/repositories/${repo.owner.login}/${repo.name}/commits`);
              const pullsResponse = await fetch(`/api/github/repositories/${repo.owner.login}/${repo.name}/pulls`);
              const aiResponse = await fetch(`/api/ai/repository-suggestions/${repo.owner.login}/${repo.name}`);
              
              const [details, commits, pulls, aiSuggestions] = await Promise.all([
                detailsResponse.ok ? detailsResponse.json() : null,
                commitsResponse.ok ? commitsResponse.json() : null,
                pullsResponse.ok ? pullsResponse.json() : null,
                aiResponse.ok ? aiResponse.json() : null,
              ]);
              
              return {
                ...repo,
                commitCount: commits?.commits?.length || 0,
                pullRequestCount: pulls?.pullRequests?.length || 0,
                aiSuggestions: aiSuggestions?.suggestions?.slice(0, 2) || [],
              };
            } catch (err) {
              console.error(`Error fetching stats for ${repo.name}:`, err);
              return {
                ...repo,
                commitCount: 0,
                pullRequestCount: 0,
                aiSuggestions: [],
              };
            }
          })
        );
        
        setRepositories(repositoriesWithStats);
      } else {
        setRepositories([]);
      }
    } catch (err) {
      console.error('Error fetching repository insights:', err);
      if (err instanceof Error && err.message.includes('GitHub not connected')) {
        setError('GitHub not connected. Connect your GitHub account to see insights.');
      } else if (err instanceof Error && err.message.includes('400')) {
        setError('GitHub connection issue. Try refreshing or reconnecting your GitHub account.');
      } else {
        setError(`Failed to load repository insights: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await fetchRepositoryInsights();
    } finally {
      setRetrying(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-3 w-3" />;
      case 'collaboration': return <Users className="h-3 w-3" />;
      case 'maintenance': return <Clock className="h-3 w-3" />;
      case 'quality': return <AlertCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Insights
          </CardTitle>
          <CardDescription>Repository activity and AI recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Insights
          </CardTitle>
          <CardDescription>Repository activity and AI recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={retrying} className="mt-2">
              {retrying ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Insights
          </CardTitle>
          <CardDescription>Repository activity and AI recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">No repositories connected yet</p>
            <Link href="/repositories">
              <Button variant="outline" size="sm">
                Connect Repositories
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              GitHub Insights
            </CardTitle>
            <CardDescription>Repository activity and AI recommendations</CardDescription>
          </div>
          <Link href="/repositories">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {repositories.map((repo) => (
          <div key={repo.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{repo.name}</h4>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GitCommit className="h-3 w-3" />
                    {repo.commitCount || 0} commits
                  </span>
                  <span className="flex items-center gap-1">
                    <GitPullRequest className="h-3 w-3" />
                    {repo.pullRequestCount || 0} PRs
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {repo.open_issues_count} issues
                  </span>
                </div>
              </div>
              <Link href={`/repositories/${repo.owner.login}/${repo.name}`}>
                <Button variant="ghost" size="sm">
                  Details
                </Button>
              </Link>
            </div>
            
            {repo.aiSuggestions && repo.aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">AI Recommendations:</p>
                {repo.aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-start gap-2 p-2 rounded-md bg-accent/50">
                    {getCategoryIcon(suggestion.category)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{suggestion.title}</p>
                        <Badge variant={getPriorityColor(suggestion.type)} className="text-xs">
                          {suggestion.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
