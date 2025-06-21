// components/github/GitHubConnect.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface GitHubConnectProps {
  projectId?: string;
  organizationId?: string;
  context?: "personal" | "project" | "organization";
  onConnectionChange?: (connected: boolean) => void;
}

export default function GitHubConnect({
  projectId,
  organizationId,
  context = "personal",
  onConnectionChange
}: GitHubConnectProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check GitHub connection status
  const checkGitHubConnection = useCallback(async () => {
    if (!user?.uid) {
      setIsConnected(false);
      return;
    }

    try {
      const response = await fetch(`/api/github/connection-status?userId=${user.uid}&context=${context}`);
      const data = await response.json();
      
      const connected = response.ok && data.connected;
      setIsConnected(connected);
      onConnectionChange?.(connected);
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      setIsConnected(false);
      onConnectionChange?.(false);
    }
  }, [user, context, onConnectionChange]);

  // Check connection on mount and when dependencies change
  useEffect(() => {
    checkGitHubConnection();
  }, [checkGitHubConnection]);

  const handleConnectGitHub = () => {
    // Determine which GitHub app to use based on context
    let GITHUB_CLIENT_ID: string | undefined;
    let GITHUB_APP_NAME: string;
    
    if (context === 'personal') {
      // Personal context uses personal GitHub app
      GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      GITHUB_APP_NAME = "taskflow-ai-personal";
    } else {
      // Project and organization contexts both use the organization GitHub app
      GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_ORG_GITHUB_CLIENT_ID;
      GITHUB_APP_NAME = "taskflow-ai-organizations";
    }
    
    if (!GITHUB_CLIENT_ID) {
      toast({
        title: "Configuration Error",
        description: `GitHub App for ${context} context is not configured properly.`,
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

    // Use GitHub's public app installation URL with the app name
    const installUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${state}`;
    
    window.location.href = installUrl;
  };

  const handleDisconnectGitHub = async () => {
    if (!user?.uid) return;

    setIsConnecting(true);

    try {
      const response = await fetch(`/api/github/auth`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          context,
          projectId: context === 'project' ? projectId : undefined,
          organizationId: context === 'organization' ? organizationId : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to disconnect GitHub');
      }

      setIsConnected(false);
      onConnectionChange?.(false);
      
      toast({
        title: "Success",
        description: "GitHub disconnected successfully",
      });
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect GitHub. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitHubIcon className="h-5 w-5" />
          GitHub Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection status...
          </div>
        ) : isConnected ? (
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
            
            <Button 
              variant="destructive" 
              onClick={handleDisconnectGitHub}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <GitHubIcon className="h-4 w-4 mr-2" />
                  Disconnect GitHub
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect GitHub for this {context} to import repositories
            </p>
            
            <Button 
              onClick={handleConnectGitHub}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GitHubIcon className="h-4 w-4 mr-2" />
                  Connect GitHub
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
