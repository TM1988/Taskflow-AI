// services/github/repositoryService.ts
"use client";

import { getAdminDb } from "@/services/admin/mongoAdmin";

export interface GitHubRepository {
  id: string | number;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  issues: number;
  updatedAt: string;
  url: string;
  private?: boolean;
  visibility?: 'public' | 'private';
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  // Project-specific fields
  projects?: string[];
  projectIds?: string[];
}

export interface ImportedRepository extends GitHubRepository {
  importedAt: string;
  projectNames: string[];
}

class GitHubRepositoryService {
  private baseUrl = '/api/github';

  /**
   * Check if user has GitHub connected for a specific context
   */
  async checkConnection(userId: string, context: string = 'personal'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/connection?userId=${userId}&context=${context}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.isConnected === true;
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
      return false;
    }
  }

  /**
   * Fetch available repositories from GitHub API
   */
  async fetchAvailableRepositories(userId: string, context: string = 'personal'): Promise<GitHubRepository[]> {
    try {
      const params = new URLSearchParams({
        userId,
        context
      });

      const response = await fetch(`${this.baseUrl}/repositories?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeRepositories(data.repositories || []);
    } catch (error) {
      console.error('Error fetching available repositories:', error);
      throw error;
    }
  }

  /**
   * Fetch imported repositories (linked to projects)
   */
  async fetchImportedRepositories(userId: string): Promise<ImportedRepository[]> {
    try {
      const response = await fetch(`/api/repositories/imported?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch imported repositories: ${response.status}`);
      }

      const data = await response.json();
      return data.repositories || [];
    } catch (error) {
      console.error('Error fetching imported repositories:', error);
      throw error;
    }
  }

  /**
   * Import repositories to a project
   */
  async importRepositoriesToProject(
    userId: string, 
    projectId: string, 
    repositories: GitHubRepository[]
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const results = {
      success: true,
      imported: 0,
      errors: [] as string[]
    };

    for (const repo of repositories) {
      try {
        await this.importSingleRepository(userId, projectId, repo.fullName);
        results.imported++;
      } catch (error) {
        results.success = false;
        results.errors.push(`Failed to import ${repo.fullName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Dispatch event for UI refresh
    if (typeof window !== 'undefined' && results.imported > 0) {
      window.dispatchEvent(new CustomEvent('repositoriesImported', {
        detail: { 
          userId, 
          projectId, 
          imported: results.imported,
          repositories: repositories.map(r => r.fullName)
        }
      }));
    }

    return results;
  }

  /**
   * Import a single repository to a project
   */
  private async importSingleRepository(userId: string, projectId: string, fullName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/repositories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        projectId,
        fullName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
  }

  /**
   * Remove repository from project
   */
  async removeRepositoryFromProject(userId: string, projectId: string, fullName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/repositories`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        projectId,
        fullName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Dispatch event for UI refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('repositoryRemoved', {
        detail: { userId, projectId, fullName }
      }));
    }
  }

  /**
   * Normalize repository data from different sources
   */
  private normalizeRepositories(repos: any[]): GitHubRepository[] {
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name || repo.fullName,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count || repo.stars || 0,
      forks: repo.forks_count || repo.forks || 0,
      issues: repo.open_issues_count || repo.issues || 0,
      updatedAt: repo.updated_at || repo.updatedAt || new Date().toISOString(),
      url: repo.html_url || repo.url || `https://github.com/${repo.full_name || repo.fullName}`,
      private: repo.private || repo.visibility === 'private',
      visibility: repo.visibility || (repo.private ? 'private' : 'public'),
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count
    }));
  }

  /**
   * Connect GitHub account
   */
  async connectGitHub(userId: string, context: string = 'personal', projectId?: string, organizationId?: string): Promise<string> {
    // Generate state for OAuth
    const state = `${Date.now()}-${Math.random().toString(36).substring(2)}-${crypto.randomUUID()}`;
    localStorage.setItem("github_oauth_state", state);
    
    // Store context information for OAuth callback
    const contextData = {
      context,
      projectId: context === 'project' ? projectId : undefined,
      organizationId: context === 'organization' ? organizationId : undefined
    };
    localStorage.setItem("github_oauth_context", JSON.stringify(contextData));

    // Clear any previous processed codes
    sessionStorage.removeItem("github_processed_code");
    
    // Use environment variable for redirect URI if available, otherwise construct from origin
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const redirectUri = `${baseUrl}/github-callback`;

    // For project and organization contexts, use GitHub App installation
    if (context === 'project' || context === 'organization') {
      const appId = process.env.NEXT_PUBLIC_ORG_GITHUB_APP_ID;
      
      if (!appId) {
        throw new Error('Organization GitHub App ID is not configured');
      }

      // Use the organization GitHub App for project and organization contexts
      const appName = "taskflow-ai-org";
      const installUrl = `https://github.com/apps/${appName}/installations/new?` +
        `state=${state}`;
      
      return installUrl;
    }
    
    // For personal context, use OAuth
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('Personal GitHub Client ID is not configured');
    }
    
    const scope = "repo,read:user";
    
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `allow_signup=false`;
    
    return authUrl;
  }

  /**
   * Disconnect GitHub account
   */
  async disconnectGitHub(userId: string, context: string = 'personal', projectId?: string, organizationId?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId,
        context,
        projectId: context === 'project' ? projectId : undefined,
        organizationId: context === 'organization' ? organizationId : undefined
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to disconnect GitHub');
    }
  }
}

// Export singleton instance
export const githubRepositoryService = new GitHubRepositoryService();
