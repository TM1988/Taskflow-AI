// components/github/GitHubRepositoryImporter.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { unifiedGitHubService, GitHubRepository } from "@/services/github/unifiedGitHubService";
import { Loader2, Search, Star, GitFork, AlertCircle } from "lucide-react";

interface GitHubRepositoryImporterProps {
  projectId: string;
  context?: string;
  onImportComplete?: (imported: GitHubRepository[]) => void;
}

export default function GitHubRepositoryImporter({ 
  projectId, 
  context = "personal",
  onImportComplete 
}: GitHubRepositoryImporterProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Check GitHub connection on mount
  useEffect(() => {
    if (user?.uid) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user?.uid) return;
    
    try {
      const connected = await unifiedGitHubService.checkConnection(user.uid, context);
      setIsConnected(connected);
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      setIsConnected(false);
    }
  };

  const loadRepositories = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const repos = await unifiedGitHubService.fetchAvailableRepositories(user.uid, context);
      setRepositories(repos);
      setSelectedRepos(new Set()); // Clear selection
    } catch (error) {
      console.error("Error loading repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load repositories. Please try reconnecting GitHub.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImporter = () => {
    if (!isConnected) {
      toast({
        title: "GitHub Not Connected",
        description: "Please connect your GitHub account first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsOpen(true);
    loadRepositories();
  };

  const handleSelectRepository = (repoId: string, checked: boolean) => {
    const newSelected = new Set(selectedRepos);
    if (checked) {
      newSelected.add(repoId);
    } else {
      newSelected.delete(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredRepoIds = filteredRepositories.map(repo => repo.id);
      setSelectedRepos(new Set(filteredRepoIds));
    } else {
      setSelectedRepos(new Set());
    }
  };

  const handleImport = async () => {
    if (!user?.uid || selectedRepos.size === 0) return;
    
    setImporting(true);
    
    try {
      const selectedRepositories = repositories.filter(repo => selectedRepos.has(repo.id));
      
      toast({
        title: "Importing Repositories",
        description: `Importing ${selectedRepositories.length} repositories...`,
      });
      
      const result = await unifiedGitHubService.importRepositoriesToProject(
        user.uid,
        projectId,
        selectedRepositories
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully imported ${result.importedCount} repositories.`,
        });
        
        onImportComplete?.(result.repositories);
        setIsOpen(false);
        setSelectedRepos(new Set());
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import repositories.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing repositories:", error);
      toast({
        title: "Error",
        description: "Failed to import repositories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query)
    );
  });

  const selectedCount = selectedRepos.size;
  const allFilteredSelected = filteredRepositories.length > 0 && 
    filteredRepositories.every(repo => selectedRepos.has(repo.id));

  return (
    <>
      <Button 
        onClick={handleOpenImporter}
        disabled={!isConnected}
        className="flex items-center gap-2"
      >
        <GitHubIcon className="h-4 w-4" />
        Import Repositories
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitHubIcon className="h-5 w-5" />
              Import GitHub Repositories
            </DialogTitle>
            <DialogDescription>
              Select repositories to import into your project. Imported repositories will be available across your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Select All */}
            {filteredRepositories.length > 0 && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({filteredRepositories.length} repositories)
                </label>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedCount} selected
                  </Badge>
                )}
              </div>
            )}

            {/* Repository List */}
            <ScrollArea className="h-[400px] w-full border rounded-md">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading repositories...</span>
                </div>
              ) : filteredRepositories.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {searchQuery ? "No repositories match your search" : "No repositories found"}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredRepositories.map((repo) => (
                    <Card key={repo.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedRepos.has(repo.id)}
                          onCheckedChange={(checked) => handleSelectRepository(repo.id, checked as boolean)}
                          id={`repo-${repo.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <label 
                              htmlFor={`repo-${repo.id}`}
                              className="font-medium cursor-pointer hover:text-primary"
                            >
                              {repo.name}
                            </label>
                            {repo.isPrivate && (
                              <Badge variant="outline" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {repo.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {repo.language && (
                              <div className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                {repo.language}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stars}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              {repo.forks}
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {repo.issues}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={selectedCount === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                `Import ${selectedCount} Repositories`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
