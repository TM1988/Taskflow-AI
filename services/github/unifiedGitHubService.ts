// services/github/unifiedGitHubService.ts
"use client";

export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  issues: number;
  updatedAt: string;
  url: string;
  isPrivate: boolean;
  projects?: string[]; // Project names this repo is connected to
}

export interface RepositoryImportResult {
  success: boolean;
  importedCount: number;
  repositories: GitHubRepository[];
  error?: string;
}

class UnifiedGitHubService {
  private static instance: UnifiedGitHubService;
  
  static getInstance(): UnifiedGitHubService {
    if (!UnifiedGitHubService.instance) {
      UnifiedGitHubService.instance = new UnifiedGitHubService();
    }
    return UnifiedGitHubService.instance;
  }

  // Fetch all available GitHub repositories for a user
  async fetchAvailableRepositories(userId: string, context: string = "personal"): Promise<GitHubRepository[]> {
    // Fetch available repositories
    
    try {
      const params = new URLSearchParams({ userId, context });
      const response = await fetch(`/api/github/repositories?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const repositories = data.repositories || [];
      
      console.log(`✅ [GitHubService] Fetched ${repositories.length} available repositories`);
      
      return repositories.map(this.normalizeRepository);
    } catch (error) {
      console.error(`❌ [GitHubService] Error fetching available repositories:`, error);
      throw error;
    }
  }

  // Fetch only imported (connected to projects) repositories
  async fetchImportedRepositories(userId: string): Promise<GitHubRepository[]> {
    // Fetch imported repositories
    
    try {
      const response = await fetch(`/api/repositories/imported?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ [GitHubService] Error response:`, errorData);
        return []; // Return empty array instead of throwing for imported repos
      }
      
      const data = await response.json();
      const repositories = data.repositories || [];
      
      console.log(`✅ [GitHubService] Fetched ${repositories.length} imported repositories`);
      
      return repositories.map(this.normalizeRepository);
    } catch (error) {
      console.error(`❌ [GitHubService] Error fetching imported repositories:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  // Import multiple repositories to a project
  async importRepositoriesToProject(
    userId: string, 
    projectId: string, 
    repositories: GitHubRepository[]
  ): Promise<RepositoryImportResult> {
    // Import repositories to project
    
    try {
      const importPromises = repositories.map(repo => 
        this.importSingleRepository(userId, projectId, repo.fullName)
      );
      
      const results = await Promise.allSettled(importPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');
      
      if (failed.length > 0) {
        console.warn(`⚠️ [GitHubService] ${failed.length} repositories failed to import`);
        failed.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to import ${repositories[index].fullName}:`, result.reason);
          }
        });
      }
      
      // Dispatch event for UI refresh
      this.dispatchImportEvent(userId, projectId, repositories);
      
      return {
        success: successful.length > 0,
        importedCount: successful.length,
        repositories: repositories.slice(0, successful.length),
        error: failed.length > 0 ? `${failed.length} repositories failed to import` : undefined
      };
    } catch (error) {
      console.error(`❌ [GitHubService] Error importing repositories:`, error);
      return {
        success: false,
        importedCount: 0,
        repositories: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Import a single repository to a project
  private async importSingleRepository(userId: string, projectId: string, fullName: string): Promise<void> {
    const response = await fetch("/api/github/repositories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, projectId, fullName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to import ${fullName}`);
    }
  }

  // Check if GitHub is connected for a user/context
  async checkConnection(userId: string, context: string = "personal", projectId?: string, organizationId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ userId, context });
      if (context === 'project' && projectId) {
        params.append('projectId', projectId);
      }
      if (context === 'organization' && organizationId) {
        params.append('organizationId', organizationId);
      }
      
      const response = await fetch(`/api/github/connection-status?${params}`);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.connected || data.isConnected || false;
    } catch (error) {
      console.error(`❌ [GitHubService] Error checking connection:`, error);
      return false;
    }
  }

  // Normalize repository data from different sources
  private normalizeRepository(repo: any): GitHubRepository {
    return {
      id: repo.id?.toString() || repo.github_id?.toString() || Math.random().toString(),
      name: repo.name,
      fullName: repo.fullName || repo.full_name || `${repo.owner?.login || 'unknown'}/${repo.name}`,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      stars: repo.stars || repo.stargazers_count || 0,
      forks: repo.forks || repo.forks_count || 0,
      issues: repo.issues || repo.open_issues_count || 0,
      updatedAt: repo.updatedAt || repo.updated_at || new Date().toISOString(),
      url: repo.url || repo.html_url || `https://github.com/${repo.fullName || repo.full_name}`,
      isPrivate: repo.private || false,
      projects: repo.projects || []
    };
  }

  // Dispatch custom event for repository import
  private dispatchImportEvent(userId: string, projectId: string, repositories: GitHubRepository[]): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('repositoriesImported', {
        detail: { userId, projectId, repositories, count: repositories.length }
      });
      window.dispatchEvent(event);
      // Dispatch repository update event
    }
  }
}

export const unifiedGitHubService = UnifiedGitHubService.getInstance();
