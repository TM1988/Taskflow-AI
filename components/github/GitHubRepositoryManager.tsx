// components/github/GitHubRepositoryManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { githubRepositoryService, GitHubRepository, ImportedRepository } from "@/services/github/repositoryService";
import { Loader2, Search, Star, GitFork, AlertCircle, ExternalLink, Plus, Trash2, RefreshCw } from "lucide-react";

interface GitHubRepositoryManagerProps {
  projectId?: string;
  organizationId?: string;
  context?: string;
}

export default function GitHubRepositoryManager({ 
  projectId, 
  organizationId, 
  context = "personal"
}: GitHubRepositoryManagerProps) {
  const { user } = useAuth();
  const { currentProject } = useWorkspace();
  const { toast } = useToast();
  
  // Use provided projectId or fall back to current project
  const effectiveProjectId = projectId || currentProject?.id;
  
  // State for available repositories (from GitHub)
  const [availableRepos, setAvailableRepos] = useState<GitHubRepository[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  
  // State for imported repositories (linked to project)
  const [importedRepos, setImportedRepos] = useState<ImportedRepository[]>([]);
  const [loadingImported, setLoadingImported] = useState(false);
  
  // UI State
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("imported");

  // Load imported repositories
  const loadImportedRepositories = async () => {
    if (!user?.uid) return;
    
    setLoadingImported(true);
    try {
      const repos = await githubRepositoryService.fetchImportedRepositories(user.uid);
      // Filter to only show repos for this project if we have project info
      const projectRepos = repos.filter(repo => 
        !effectiveProjectId || repo.projectIds?.includes(effectiveProjectId) || (repo.projects && repo.projects.length > 0)
      );
      setImportedRepos(projectRepos);
      console.log(`📚 Loaded ${projectRepos.length} imported repositories for project`);
    } catch (error) {
      console.error("Error loading imported repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load imported repositories.",
        variant: "destructive",
      });
    } finally {
      setLoadingImported(false);
    }
  };

  // Load available repositories from GitHub
  const loadAvailableRepositories = async () => {
    if (!user?.uid) return;
    
    setLoadingAvailable(true);
    try {
      const repos = await githubRepositoryService.fetchAvailableRepositories(
        user.uid, 
        context,
        effectiveProjectId, // Pass the projectId for project contexts
        organizationId // Pass organizationId for organization contexts
      );
      setAvailableRepos(repos);
      console.log(`📚 Loaded ${repos.length} available repositories from GitHub for context: ${context}`);
    } catch (error) {
      console.error("Error loading available repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load repositories from GitHub. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Load repositories on mount
  useEffect(() => {
    loadImportedRepositories();
  }, [user]);

  // Listen for import/remove events
  useEffect(() => {
    const handleRepositoryUpdate = () => {
      console.log("🔄 Repository update event received, refreshing...");
      loadImportedRepositories();
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

  // Handle opening import dialog
  const handleOpenImportDialog = () => {
    setIsImportDialogOpen(true);
    if (availableRepos.length === 0) {
      loadAvailableRepositories();
    }
  };

  // Handle repository selection
  const handleRepositorySelect = (repoFullName: string, selected: boolean) => {
    const newSelected = new Set(selectedRepos);
    if (selected) {
      newSelected.add(repoFullName);
    } else {
      newSelected.delete(repoFullName);
    }
    setSelectedRepos(newSelected);
  };

  // Handle repository import
  const handleImportRepositories = async () => {
    if (!user?.uid || selectedRepos.size === 0) return;

    // For personal workspace without a project, we need to handle differently
    if (!effectiveProjectId) {
      toast({
        title: "Project Required",
        description: "Please select a project to import repositories to. Go to Projects page to create or select a project.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const reposToImport = availableRepos.filter(repo => selectedRepos.has(repo.fullName));
      const result = await githubRepositoryService.importRepositoriesToProject(
        user.uid, 
        effectiveProjectId, 
        reposToImport
      );

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.imported} ${result.imported === 1 ? 'repository' : 'repositories'}.`,
        });
        
        setSelectedRepos(new Set());
        setIsImportDialogOpen(false);
        loadImportedRepositories();
      } else {
        toast({
          title: "Import Issues",
          description: `Imported ${result.imported} repositories, but encountered ${result.errors.length} errors.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing repositories:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import repositories.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle repository removal
  const handleRemoveRepository = async (repo: ImportedRepository) => {
    if (!user?.uid || !effectiveProjectId) return;

    try {
      await githubRepositoryService.removeRepositoryFromProject(user.uid, effectiveProjectId, repo.fullName);
      
      toast({
        title: "Repository Removed",
        description: `${repo.name} has been removed from the project.`,
      });
      
      loadImportedRepositories();
    } catch (error) {
      console.error("Error removing repository:", error);
      toast({
        title: "Remove Failed",
        description: error instanceof Error ? error.message : "Failed to remove repository.",
        variant: "destructive",
      });
    }
  };

  // Filter repositories based on search
  const filteredAvailableRepos = availableRepos.filter(repo => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query)
    );
  });

  const filteredImportedRepos = importedRepos.filter(repo => {
    if (!searchQuery.trim()) return true;
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
      {!effectiveProjectId && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">No Project Selected</p>
              <p className="text-sm text-muted-foreground">
                Please select a workspace context to import repositories. This feature requires a project or organization context.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository Management</CardTitle>
              <CardDescription>
                Manage GitHub repositories for this project
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadImportedRepositories}
                disabled={loadingImported}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingImported ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleOpenImportDialog}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Import Repositories
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="imported">
                Imported ({importedRepos.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="imported" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search imported repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {loadingImported ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading imported repositories...
                </div>
              ) : filteredImportedRepos.length > 0 ? (
                <div className="space-y-3">
                  {filteredImportedRepos.map((repo) => (
                    <div key={repo.fullName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{repo.name}</h4>
                          {repo.private && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                          {repo.language && (
                            <Badge variant="secondary" className="text-xs">{repo.language}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {repo.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stars}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {repo.issues} issues
                          </span>
                          <span>Updated {formatDate(repo.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRepository(repo)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No repositories match your search." : "No repositories imported yet. Click 'Import Repositories' to get started."}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Import GitHub Repositories</DialogTitle>
            <DialogDescription>
              Select repositories from your GitHub account to import into this project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 space-y-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <ScrollArea className="flex-1 max-h-[50vh] pr-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading repositories from GitHub...
                </div>
              ) : filteredAvailableRepos.length > 0 ? (
                <div className="space-y-3">
                  {filteredAvailableRepos.map((repo) => (
                    <div key={repo.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`repo-${repo.id}`}
                        checked={selectedRepos.has(repo.fullName)}
                        onCheckedChange={(checked) => 
                          handleRepositorySelect(repo.fullName, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor={`repo-${repo.id}`}
                            className="font-medium cursor-pointer truncate"
                          >
                            {repo.name}
                          </label>
                          {repo.private && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                          {repo.language && (
                            <Badge variant="secondary" className="text-xs">{repo.language}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {repo.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stars}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {repo.issues} issues
                          </span>
                          <span>Updated {formatDate(repo.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No repositories match your search." : "No repositories available."}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportRepositories}
              disabled={selectedRepos.size === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${selectedRepos.size} ${selectedRepos.size === 1 ? 'Repository' : 'Repositories'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
