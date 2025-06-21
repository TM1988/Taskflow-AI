// components/github/GitHubConnectionManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { githubRepositoryService } from "@/services/github/repositoryService";
import GitHubRepositoryManager from "./GitHubRepositoryManager";
import PersonalRepositoryManager from "./PersonalRepositoryManager";

interface GitHubConnectionManagerProps {
  projectId?: string;
  organizationId?: string;
  context?: "personal" | "project" | "organization";
  showRepositoryManager?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export default function GitHubConnectionManager({ 
  projectId, 
  organizationId,
  context = "personal",
  showRepositoryManager = false,
  onConnectionChange
}: GitHubConnectionManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check GitHub connection status
  const checkConnection = useCallback(async () => {
    if (!user?.uid) {
      setIsConnected(false);
      return;
    }

    try {
      const connected = await githubRepositoryService.checkConnection(
        user.uid, 
        context,
        projectId,
        organizationId
      );
      setIsConnected(connected);
      onConnectionChange?.(connected);
      
      console.log(`🔍 GitHub connection status for ${context}: ${connected ? 'Connected' : 'Not connected'}`);
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      setIsConnected(false);
      onConnectionChange?.(false);
    }
  }, [user, context, projectId, organizationId, onConnectionChange]);

  // Check connection on mount and when dependencies change
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle GitHub connection
  const handleConnect = async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect GitHub.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const authUrl = await githubRepositoryService.connectGitHub(
        user.uid, 
        context, 
        projectId, 
        organizationId
      );

      // Redirect to GitHub OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating GitHub connection:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to GitHub. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  // Handle GitHub disconnection
  const handleDisconnect = async () => {
    if (!user?.uid) return;

    setIsConnecting(true);

    try {
      await githubRepositoryService.disconnectGitHub(
        user.uid, 
        context, 
        projectId, 
        organizationId
      );

      setIsConnected(false);
      onConnectionChange?.(false);

      toast({
        title: "GitHub Disconnected",
        description: "Your GitHub account has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect GitHub. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle successful OAuth callback (external trigger)
  const handleConnectionSuccess = useCallback(async () => {
    console.log("🔄 GitHubConnectionManager: GitHub connection event received!");
    console.log("🔄 GitHubConnectionManager: Refreshing connection status...");
    await checkConnection();
    
    // Note: For OAuth Apps, we don't auto-import all repositories
    // Instead, we show the repository manager for users to select which ones to import
    console.log("✅ GitHubConnectionManager: GitHub connected, repository manager should now be available");
  }, [checkConnection]);

  // Listen for OAuth success events
  useEffect(() => {
    console.log("🔍 GitHubConnectionManager: Setting up githubConnected event listener");
    window.addEventListener('githubConnected', handleConnectionSuccess);
    return () => {
      console.log("🔍 GitHubConnectionManager: Removing githubConnected event listener");
      window.removeEventListener('githubConnected', handleConnectionSuccess);
    };
  }, [handleConnectionSuccess]);

  if (isConnected === null) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Checking GitHub connection...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitHubIcon className="h-5 w-5" />
            GitHub Connection
          </CardTitle>
          <CardDescription>
            {context === "personal" && "Connect your personal GitHub account. You'll be able to select which repositories to import after connecting."}
            {context === "project" && "Connect GitHub for this project to import repositories"}
            {context === "organization" && "Connect GitHub for your organization to access team repositories"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
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
              
              {context === "personal" && (
                <div className="text-sm text-muted-foreground mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    📋 Repository Access
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Your connected GitHub repositories will be displayed below. Repository access is managed through your GitHub App installation.
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
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
              onClick={handleConnect}
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

      {/* Show repository manager if connected and requested */}
      {isConnected && showRepositoryManager && (
        context === "personal" ? (
          <PersonalRepositoryManager context={context} />
        ) : (
          <GitHubRepositoryManager 
            projectId={projectId}
            organizationId={organizationId}
            context={context}
          />
        )
      )}
    </div>
  );
}
