// components/github/GitHubConnect.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GitHubIcon } from "@/components/icons";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface GitHubConnectProps {
  projectId?: string;
}

export const GitHubConnect: React.FC<GitHubConnectProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user has connected GitHub
  useEffect(() => {
    const checkGitHubConnection = async () => {
      if (!user?.uid) return;

      try {
        // Use API route instead of direct MongoDB call
        const response = await fetch(`/api/github/connection-status?userId=${user.uid}`);
        if (!response.ok) {
          throw new Error('Failed to check connection status');
        }
        const data = await response.json();
        setIsConnected(data.isConnected);
      } catch (error) {
        console.error("Error checking GitHub connection:", error);
        setIsConnected(false);
      }
    };

    if (user) {
      checkGitHubConnection();
    } else {
      setIsConnected(false);
    }
  }, [user]);

  const connectRepository = async (fullName: string) => {
    if (!user || !projectId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/github/connect-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, projectId, repositoryFullName: fullName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect repository');
      }
      
      // Refresh repositories
      loadRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect repository");
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/github/repositories?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        console.error('Failed to load repositories');
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]); // Added dependency

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  const handleConnectGitHub = () => {
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    
    if (!GITHUB_CLIENT_ID) {
      toast({
        title: "Configuration Error",
        description: "GitHub Client ID is not configured.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    // Generate a stronger state with timestamp + random
    const state = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    localStorage.setItem("github_oauth_state", state);

    // Get the current origin for the redirect URI
    const redirectUri = `${window.location.origin}/github-callback`;

    // Redirect to GitHub OAuth
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo,read:user&state=${state}`;
    window.location.href = authUrl;
  };

  const handleDisconnectGitHub = async () => {
    if (!user?.uid) return;

    setIsConnecting(true);

    try {
      // Call API to remove GitHub token
      const response = await fetch("/api/github/auth", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
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
