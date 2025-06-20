// components/github/PersonalRepositoryManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { githubRepositoryService, GitHubRepository } from "@/services/github/repositoryService";
import { Loader2, Search, Star, GitFork, ExternalLink, RefreshCw, Calendar } from "lucide-react";

interface PersonalRepositoryManagerProps {
  context?: string;
}

export default function PersonalRepositoryManager({ 
  context = "personal"
}: PersonalRepositoryManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for available repositories (from GitHub)
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load repositories from GitHub
  const loadRepositories = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // First check if GitHub is connected
      const isConnected = await githubRepositoryService.checkConnection(user.uid, context);
      if (!isConnected) {
        setRepositories([]); // Clear repositories if not connected
        return; // Don't show error toast, just silently return
      }

      const repos = await githubRepositoryService.fetchAvailableRepositories(user.uid, context);
      setRepositories(repos);
    } catch (error) {
      console.error("Error loading repositories:", error);
      // Only show error toast for real connection errors, not auth issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('not connected') && 
          !errorMessage.includes('No GitHub token') &&
          !errorMessage.includes('401') &&
          !errorMessage.includes('403')) {
        toast({
          title: "Error",
          description: "Failed to load repositories from GitHub. Please check your connection.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, context, toast]);

  // Load repositories on mount
  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  // Listen for connection events
  useEffect(() => {
    const handleRepositoryUpdate = () => {
      loadRepositories();
    };

    window.addEventListener('repositories-updated', handleRepositoryUpdate);
    window.addEventListener('githubConnected', handleRepositoryUpdate);
    
    return () => {
      window.removeEventListener('repositories-updated', handleRepositoryUpdate);
      window.removeEventListener('githubConnected', handleRepositoryUpdate);
    };
  }, [loadRepositories]);

  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your GitHub Repositories</CardTitle>
              <CardDescription>
                Repositories from your connected GitHub account
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRepositories}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading repositories...</span>
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                {searchQuery ? "No repositories match your search" : "No repositories found"}
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Connect to GitHub or check your GitHub permissions"
                }
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredRepositories.length} of {repositories.length} repositories
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredRepositories.map((repo) => (
                    <Card key={repo.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm truncate">
                              {repo.name}
                            </h3>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                            {repo.language && (
                              <Badge variant="outline" className="text-xs">
                                {repo.language}
                              </Badge>
                            )}
                          </div>
                          
                          {repo.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stars || repo.stargazers_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              {repo.forks || repo.forks_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(repo.updatedAt)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
