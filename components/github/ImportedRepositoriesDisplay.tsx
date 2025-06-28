// components/github/ImportedRepositoriesDisplay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { githubRepositoryService, ImportedRepository } from "@/services/github/repositoryService";
import { Loader2, Search, Star, GitFork, AlertCircle, ExternalLink, RefreshCw, Eye } from "lucide-react";
import Link from "next/link";

interface ImportedRepositoriesDisplayProps {
  title?: string;
  description?: string;
  showSearch?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function ImportedRepositoriesDisplay({
  title = "Imported Repositories",
  description = "GitHub repositories linked to your projects",
  showSearch = true,
  emptyMessage = "No imported repositories yet. Link repositories to projects to see them here.",
  className = ""
}: ImportedRepositoriesDisplayProps) {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState<ImportedRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load imported repositories
  const loadRepositories = async (showSpinner = true) => {
    if (!user?.uid) {
      setRepositories([]);
      setLoading(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const repos = await githubRepositoryService.fetchImportedRepositories(user.uid);
      setRepositories(repos);
      console.log(`� [ImportedReposDisplay] Loaded ${repos.length} imported repositories`);
    } catch (error) {
      console.error("Error loading imported repositories:", error);
      setRepositories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load repositories on mount and user change
  useEffect(() => {
    loadRepositories();
  }, [user]);

  // Listen for repository import/remove events
  useEffect(() => {
    const handleRepositoryUpdate = (event: any) => {
      // Repository update event received, refreshing...
      loadRepositories(false); // Don't show loading spinner for updates
    };

    window.addEventListener('repositoriesImported', handleRepositoryUpdate);
    window.addEventListener('repositoryImported', handleRepositoryUpdate);
    window.addEventListener('repositoryRemoved', handleRepositoryUpdate);

    return () => {
      window.removeEventListener('repositoriesImported', handleRepositoryUpdate);
      window.removeEventListener('repositoryImported', handleRepositoryUpdate);
      window.removeEventListener('repositoryRemoved', handleRepositoryUpdate);
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    loadRepositories(false);
  };

  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      repo.projectNames?.some(project => project.toLowerCase().includes(query))
    );
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading repositories...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitHubIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        )}

        {filteredRepositories.length > 0 ? (
          <div className="space-y-4">
            {filteredRepositories.map((repo) => (
              <div key={repo.fullName} className="p-4 border rounded-lg space-y-3">
                {/* Repository Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{repo.name}</h3>
                      {repo.private && (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                      {repo.language && (
                        <Badge variant="secondary" className="text-xs">{repo.language}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {repo.fullName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link
                        href={`/repositories/${repo.fullName.split('/')[0]}/${repo.name}`}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Repository Description */}
                {repo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {repo.description}
                  </p>
                )}

                {/* Repository Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {repo.stars || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    {repo.forks || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {repo.issues || 0} issues
                  </span>
                  <span>Updated {formatDate(repo.updatedAt)}</span>
                </div>

                {/* Project Links */}
                {repo.projectNames && repo.projectNames.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Projects:</span>
                    <div className="flex gap-1 flex-wrap">
                      {repo.projectNames.map((projectName) => (
                        <Badge key={projectName} variant="outline" className="text-xs">
                          {projectName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <GitHubIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">
              {searchQuery ? "No repositories match your search" : "No imported repositories"}
            </p>
            <p className="text-sm">
              {searchQuery ? "Try adjusting your search terms." : emptyMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
