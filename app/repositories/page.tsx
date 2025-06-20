// app/repositories/page.tsx
"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/services/auth/AuthContext";
import { useEffect } from "react";
import ImportedRepositoriesDisplay from "@/components/github/ImportedRepositoriesDisplay";
import GitHubConnectionManager from "@/components/github/GitHubConnectionManager";

export default function RepositoriesPage() {
  const { isPersonalWorkspace } = useWorkspace();
  const { user } = useAuth();

  // Check if GitHub was just connected and trigger a refresh
  useEffect(() => {
    const wasJustConnected = localStorage.getItem("github_just_connected");
    if (wasJustConnected) {
      console.log("🔄 GitHub was just connected, triggering connection refresh...");
      localStorage.removeItem("github_just_connected");
      
      // Dispatch the connection event to refresh the GitHubConnectionManager
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('githubConnected', {
          detail: { refreshRequired: true }
        }));
      }, 500); // Small delay to ensure components are mounted
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isPersonalWorkspace ? "Personal Repositories" : "Organization Repositories"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isPersonalWorkspace
            ? "Your personal GitHub repositories"
            : "Organization repositories"}
        </p>
      </div>

      {/* GitHub Connection for Personal Workspace */}
      {isPersonalWorkspace && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">GitHub Integration</h2>
            <p className="text-sm text-muted-foreground">
              Connect your personal GitHub account to manage your repositories
            </p>
          </div>
          
          <GitHubConnectionManager
            context="personal"
            showRepositoryManager={true}
          />
        </div>
      )}

      {/* Show repositories based on workspace type */}
      {isPersonalWorkspace ? (
        // For personal workspace, repositories are shown in the PersonalRepositoryManager above
        // No need for additional ImportedRepositoriesDisplay
        <></>
      ) : (
        // For organization workspace, show imported repositories
        <ImportedRepositoriesDisplay
          title="Organization Repositories"
          description="GitHub repositories for your organization"
          emptyMessage="No repositories found for this organization."
        />
      )}
    </div>
  );
}
