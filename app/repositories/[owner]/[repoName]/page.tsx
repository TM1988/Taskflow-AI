"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import RepositoryTaskLinker from "@/components/github/repository-task-linker";
import { 
  ArrowLeft, 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  AlertCircle, 
  Star, 
  Eye, 
  Users,
  Calendar,
  FileText,
  ExternalLink,
  Activity,
  Zap,
  Link as LinkIcon
} from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  language: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

interface AISuggestion {
  id: string;
  type: 'workload' | 'code' | 'pr' | 'issue' | 'task';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  relatedItems?: string[];
}

export default function RepositoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const owner = params.owner as string;
  const repoName = params.repoName as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (owner && repoName && user?.uid) {
      fetchRepositoryData();
    }
  }, [owner, repoName, user?.uid]);

  const fetchRepositoryData = async () => {
    try {
      setLoading(true);
      
      // Create headers with user ID
      const headers = {
        'Content-Type': 'application/json',
        ...(user?.uid && { 'x-user-id': user.uid })
      };
      
      // Fetch repository details
      const repoResponse = await fetch(`/api/github/repositories/${owner}/${repoName}`, { headers });
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        setRepository(repoData);
      }

      // Fetch commits
      const commitsResponse = await fetch(`/api/github/repositories/${owner}/${repoName}/commits`, { headers });
      if (commitsResponse.ok) {
        const commitsData = await commitsResponse.json();
        setCommits(commitsData);
      }

      // Fetch pull requests
      const prsResponse = await fetch(`/api/github/repositories/${owner}/${repoName}/pulls`, { headers });
      if (prsResponse.ok) {
        const prsData = await prsResponse.json();
        setPullRequests(prsData);
      }

      // Fetch issues
      const issuesResponse = await fetch(`/api/github/repositories/${owner}/${repoName}/issues`, { headers });
      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        setIssues(issuesData);
      }

      // Fetch AI suggestions
      const aiResponse = await fetch(`/api/ai/repository-suggestions/${owner}/${repoName}`, { headers });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiSuggestions(aiData.suggestions || []);
      }

    } catch (error) {
      console.error("Error fetching repository data:", error);
      toast({
        title: "Error",
        description: "Failed to load repository data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Repository Not Found</h1>
          <p>The requested repository could not be found.</p>
          <Button onClick={() => router.push("/repositories")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Repositories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/repositories")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{repository.name}</h1>
            <p className="text-muted-foreground">{repository.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {repository.stargazers_count}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {repository.watchers_count}
          </Badge>
          <Button
            variant="outline"
            onClick={() => window.open(repository.html_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on GitHub
          </Button>
        </div>
      </div>

      {/* Repository Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Commits</span>
            </div>
            <div className="text-2xl font-bold">{commits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Pull Requests</span>
            </div>
            <div className="text-2xl font-bold">{pullRequests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Issues</span>
            </div>
            <div className="text-2xl font-bold">{repository.open_issues_count}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI Suggestions</span>
            </div>
            <div className="text-2xl font-bold">{aiSuggestions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions Banner */}
      {aiSuggestions.length > 0 && (
        <Card className="mb-6 border-gray-800 bg-black text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" />
              AI Insights & Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiSuggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.id} className="flex items-start gap-3">
                  <Badge className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{suggestion.title}</h4>
                    <p className="text-sm text-gray-300">{suggestion.description}</p>
                  </div>
                </div>
              ))}
              {aiSuggestions.length > 3 && (
                <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800" onClick={() => setActiveTab("ai-insights")}>
                  View all {aiSuggestions.length} suggestions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
          <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Commits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5" />
                  Recent Commits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commits.slice(0, 5).map((commit) => (
                    <div key={commit.sha} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={commit.author?.avatar_url} />
                        <AvatarFallback>
                          {commit.commit.author.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {commit.commit.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {commit.author?.login} • {formatDate(commit.commit.author.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">#{issue.number} {issue.title}</h4>
                        <Badge variant={issue.state === 'open' ? 'destructive' : 'secondary'}>
                          {issue.state}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Opened {formatDate(issue.created_at)} by {issue.user.login}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commits">
          <Card>
            <CardHeader>
              <CardTitle>All Commits</CardTitle>
              <CardDescription>Recent commit history for this repository</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commits.map((commit) => (
                  <div key={commit.sha} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={commit.author?.avatar_url} />
                      <AvatarFallback>
                        {commit.commit.author.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{commit.commit.message}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{commit.author?.login || commit.commit.author.name}</span>
                        <span>{formatDate(commit.commit.author.date)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(commit.html_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pulls">
          <Card>
            <CardHeader>
              <CardTitle>Pull Requests</CardTitle>
              <CardDescription>Open and recent pull requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pullRequests.map((pr) => (
                  <div key={pr.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">#{pr.number} {pr.title}</h4>
                      <Badge variant={pr.state === 'open' ? 'default' : 'secondary'}>
                        {pr.state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {pr.body?.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={pr.user.avatar_url} />
                          <AvatarFallback>{pr.user.login.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{pr.user.login}</span>
                        <span className="text-sm text-muted-foreground">
                          • {formatDate(pr.created_at)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(pr.html_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View PR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Issues</CardTitle>
              <CardDescription>Repository issues and bug reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">#{issue.number} {issue.title}</h4>
                      <Badge variant={issue.state === 'open' ? 'destructive' : 'secondary'}>
                        {issue.state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {issue.body?.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.user.avatar_url} />
                          <AvatarFallback>{issue.user.login.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{issue.user.login}</span>
                        <span className="text-sm text-muted-foreground">
                          • {formatDate(issue.created_at)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(issue.html_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Issue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="task-linking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-500" />
                Task-Commit Linking
              </CardTitle>
              <CardDescription>
                Link tasks to commits and pull requests for better project tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RepositoryTaskLinker 
                repositoryOwner={owner}
                repositoryName={repoName}
                commits={commits}
                pullRequests={pullRequests}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights">
          <Card className="border-gray-800 bg-black text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                AI-Powered Insights & Recommendations
              </CardTitle>
              <CardDescription className="text-gray-300">
                Smart suggestions based on your repository activity, team workload, and project tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-4 border border-gray-700 rounded-lg bg-gray-900">
                    <div className="flex items-start gap-3">
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium mb-2 text-white">{suggestion.title}</h4>
                        <p className="text-sm text-gray-300 mb-3">
                          {suggestion.description}
                        </p>
                        {suggestion.actionable && (
                          <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
