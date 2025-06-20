// components/github/GitHubConnect.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";
import { unifiedGitHubService } from "@/services/github/unifiedGitHubService";
import GitHubRepositoryImporter from "./GitHubRepositoryImporter";

interface GitHubConnectProps {
  projectId?: string;
  organizationId?: string;
  context?: "personal" | "project" | "organization";
  showImporter?: boolean;
}

export const GitHubConnect: React.FC<GitHubConnectProps> = ({ 
  projectId, 
  organizationId,
  context = "personal",
  showImporter = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user has connected GitHub for this context
  const checkGitHubConnection = useCallback(async () => {
    if (!user?.uid) return;

    console.log(`🔍 GitHubConnect: Checking connection for context: ${context}, orgId: ${organizationId}, projectId: ${projectId}`);

    try {
      const connected = await unifiedGitHubService.checkConnection(user.uid, context, projectId, organizationId);
      console.log(`🔍 GitHubConnect: Setting connected state to: ${connected}`);
      setIsConnected(connected);
    } catch (error) {
      console.log("🔍 GitHubConnect: Error checking connection:", error instanceof Error ? error.message : "Not connected");
      setIsConnected(false);
    }
  }, [user, context, projectId, organizationId]);

  useEffect(() => {
    if (user) {
      checkGitHubConnection();
    } else {
      setIsConnected(false);
    }
  }, [user, checkGitHubConnection]);

  const handleConnectGitHub = () => {
    // Use the appropriate GitHub client ID and App name based on context
    // For both personal and project contexts, use personal credentials
    const GITHUB_CLIENT_ID = context === "organization" 
      ? process.env.NEXT_PUBLIC_ORG_GITHUB_CLIENT_ID 
      : process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    
    const GITHUB_APP_NAME = context === "organization" 
      ? "taskflow-ai-organizations"
      : "taskflow-ai-personal";
    
    if (!GITHUB_CLIENT_ID) {
      toast({
        title: "Configuration Error",
        description: `GitHub App is not configured for ${context} context.`,
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    // Clear any previous processed codes to prevent conflicts
    sessionStorage.removeItem("github_processed_code");

    // Generate a stronger state with timestamp + random
    const state = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    localStorage.setItem("github_oauth_state", state);
    
    // Store context information for OAuth callback
    const contextData = {
      context,
      projectId: context === 'project' ? projectId : undefined,
      organizationId: context === 'organization' ? organizationId : undefined
    };
    localStorage.setItem("github_oauth_context", JSON.stringify(contextData));

    // For GitHub Apps, we use the installation flow with the app name
    // This allows users to select which repositories to grant access to
    const installUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${state}`;
    
    console.log(`🔄 Redirecting to GitHub App installation: ${installUrl}`);
    window.location.href = installUrl;
  };

  const handleDisconnectGitHub = async () => {
    if (!user?.uid) return;

    setIsConnecting(true);

    try {
      // Call API to remove GitHub token with context
      const response = await fetch("/api/github/auth", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.uid,
          context,
          projectId: context === 'project' ? projectId : undefined,
          organizationId: context === 'organization' ? organizationId : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disconnect GitHub");
      }

      setIsConnected(false);
      toast({
        title: "Success",
        description: "GitHub disconnected successfully",
      });
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from GitHub. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Show loading state while checking connection
  if (isConnected === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitHubIcon className="h-5 w-5" />
            GitHub Connection
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to sync repositories and track progress
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitHubIcon className="h-5 w-5" />
          GitHub Connection
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to sync repositories and track progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub Connected Successfully
            </div>
            <div className="flex gap-2">
              {showImporter && projectId && (
                <GitHubRepositoryImporter 
                  projectId={projectId}
                  context={context}
                />
              )}
              <Button
                variant="outline"
                onClick={handleDisconnectGitHub}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect GitHub"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="flex items-center gap-2"
            onClick={handleConnectGitHub}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <GitHubIcon className="h-4 w-4" />
                Connect GitHub
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GitHubConnect;
