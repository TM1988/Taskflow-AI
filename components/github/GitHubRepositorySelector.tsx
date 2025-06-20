// components/github/GitHubRepositorySelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Search, Star, GitFork, Eye, Lock, Users } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  visibility: "public" | "private";
  updated_at: string;
}

interface GitHubRepositorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectionComplete: (repositories: Repository[]) => void;
  repositories: Repository[];
  loading?: boolean;
}

export default function GitHubRepositorySelector({
  open,
  onOpenChange,
  onSelectionComplete,
  repositories,
  loading = false
}: GitHubRepositorySelectorProps) {
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState<"all" | "public" | "private" | "custom">("custom");
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>(repositories);
  const { toast } = useToast();

  console.log(`🔍 GitHubRepositorySelector: Component rendered with ${repositories.length} repositories:`, repositories.slice(0, 2));

  // Update filtered repos when search or repositories change
  useEffect(() => {
    let filtered = repositories;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
      );
    }

    setFilteredRepos(filtered);
  }, [repositories, searchQuery]);

  // Handle selection mode changes
  useEffect(() => {
    switch (selectionMode) {
      case "all":
        setSelectedRepos([...repositories]);
        break;
      case "public":
        setSelectedRepos(repositories.filter(repo => !repo.private));
        break;
      case "private":
        setSelectedRepos(repositories.filter(repo => repo.private));
        break;
      case "custom":
        // Keep current selection
        break;
    }
  }, [selectionMode, repositories]);

  const handleRepoToggle = (repo: Repository) => {
    setSelectedRepos(prev => {
      const isSelected = prev.some(r => r.id === repo.id);
      if (isSelected) {
        return prev.filter(r => r.id !== repo.id);
      } else {
        return [...prev, repo];
      }
    });
    
    // Switch to custom mode when manually selecting
    if (selectionMode !== "custom") {
      setSelectionMode("custom");
    }
  };

  const handleComplete = () => {
    if (selectedRepos.length === 0) {
      toast({
        title: "No repositories selected",
        description: "Please select at least one repository to import.",
        variant: "destructive"
      });
      return;
    }

    onSelectionComplete(selectedRepos);
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const publicRepos = repositories.filter(repo => !repo.private);
  const privateRepos = repositories.filter(repo => repo.private);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Repositories to Import</DialogTitle>
          <DialogDescription>
            Choose which GitHub repositories you want to import into Taskflow AI.
            You can select all repositories, only public/private ones, or choose specific repositories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Selection Mode */}
          <div className="space-y-2 flex-shrink-0">
            <Label>Import Options</Label>
            <Select value={selectionMode} onValueChange={(value: any) => setSelectionMode(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose import option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Repositories ({repositories.length})
                </SelectItem>
                <SelectItem value="public">
                  Public Repositories Only ({publicRepos.length})
                </SelectItem>
                <SelectItem value="private">
                  Private Repositories Only ({privateRepos.length})
                </SelectItem>
                <SelectItem value="custom">
                  Custom Selection ({selectedRepos.length} selected)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2 flex-shrink-0">
            <Label>Search Repositories</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, description, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Repository List */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger value="all">All ({filteredRepos.length})</TabsTrigger>
                <TabsTrigger value="public">Public ({filteredRepos.filter(r => !r.private).length})</TabsTrigger>
                <TabsTrigger value="private">Private ({filteredRepos.filter(r => r.private).length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 overflow-hidden mt-4">
                <RepositoryList 
                  repositories={filteredRepos}
                  selectedRepos={selectedRepos}
                  onRepoToggle={handleRepoToggle}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="public" className="flex-1 overflow-hidden mt-4">
                <RepositoryList 
                  repositories={filteredRepos.filter(r => !r.private)}
                  selectedRepos={selectedRepos}
                  onRepoToggle={handleRepoToggle}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="private" className="flex-1 overflow-hidden mt-4">
                <RepositoryList 
                  repositories={filteredRepos.filter(r => r.private)}
                  selectedRepos={selectedRepos}
                  onRepoToggle={handleRepoToggle}
                  loading={loading}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedRepos.length} of {repositories.length} repositories selected
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={selectedRepos.length === 0}>
              Import Selected Repositories
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RepositoryListProps {
  repositories: Repository[];
  selectedRepos: Repository[];
  onRepoToggle: (repo: Repository) => void;
  loading: boolean;
}

function RepositoryList({ repositories, selectedRepos, onRepoToggle, loading }: RepositoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading repositories...</div>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="space-y-2">
          <p>No repositories found</p>
          <p className="text-sm">
            Make sure you have access to repositories or try connecting GitHub again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-2 pr-4">
        {repositories.map((repo) => {
          const isSelected = selectedRepos.some(r => r.id === repo.id);
          
          return (
            <div
              key={repo.id}
              className={`flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                isSelected ? 'bg-muted border-primary' : ''
              }`}
              onClick={() => onRepoToggle(repo)}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => onRepoToggle(repo)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium truncate">{repo.name}</h4>
                  {repo.private ? (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>Private</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>Public</span>
                    </Badge>
                  )}
                  {repo.language && (
                    <Badge variant="outline">{repo.language}</Badge>
                  )}
                </div>
                
                {repo.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {repo.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GitFork className="h-3 w-3" />
                    <span>{repo.forks_count}</span>
                  </div>
                  <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
