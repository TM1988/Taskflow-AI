// app/github-callback/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function GitHubCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [redirectDescription, setRedirectDescription] = useState<string>("Redirecting...");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const hasProcessed = useRef(false);
  const retryCount = useRef(0);

  useEffect(() => {
    // Only proceed if we haven't processed yet and user is loaded (not undefined)
    if (hasProcessed.current || user === undefined) return;

    // If user is null (not authenticated), we need to wait for authentication
    if (user === null) {
      return;
    }

    // User is authenticated, proceed with callback

    // Set a timeout to prevent hanging indefinitely
    const timeoutId = setTimeout(() => {
      if (status === "loading" && !hasProcessed.current) {
        setStatus("error");
        setErrorMessage("Connection timeout. Please try again.");
      }
    }, 15000); // Reduced to 15 seconds

    async function handleGitHubCallback() {
      // Prevent multiple executions
      if (hasProcessed.current) {
        clearTimeout(timeoutId);
        return;
      }
      
      try {
        // Get query params from URL first - don't wait for user auth
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");
        const installationId = urlParams.get("installation_id");
        const setupAction = urlParams.get("setup_action");

        // Check if this is a GitHub App installation callback
        if (installationId && setupAction === "install") {
          // For GitHub Apps, after installation, GitHub redirects to this URL with installation_id
          // We need to complete the OAuth flow to get user access token
          // If there's no code yet, we need to initiate the OAuth authorization flow
          if (!code) {
            
            // Get context information
            const contextData = localStorage.getItem("github_oauth_context");
            let context = "personal";
            if (contextData) {
              try {
                const parsed = JSON.parse(contextData);
                context = parsed.context || "personal";
              } catch (error) {
                // Error parsing context data
              }
            }

            // Use the appropriate GitHub client ID based on context
            const GITHUB_CLIENT_ID = (context === "project" || context === "organization") 
              ? process.env.NEXT_PUBLIC_ORG_GITHUB_CLIENT_ID 
              : process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

            const redirectUri = `${window.location.origin}/github-callback`;
            const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}`;
            
            window.location.href = authUrl;
            return;
          }
        }

        // Check for GitHub OAuth errors first
        if (error) {
          setStatus("error");
          setErrorMessage(
            errorDescription || 
            (error === "access_denied" ? "GitHub access was denied" : `GitHub error: ${error}`)
          );
          clearTimeout(timeoutId);
          return;
        }

        if (!code) {
          setStatus("error");
          setErrorMessage("No authorization code received from GitHub");
          clearTimeout(timeoutId);
          return;
        }

        // Validate state parameter to prevent CSRF attacks
        const storedState = localStorage.getItem("github_oauth_state");
        
        // Check if this is a CLI-initiated OAuth flow
        const isCLIOAuth = state && state.startsWith('cli_oauth_');
        
        if (!isCLIOAuth && (!state || !storedState || state !== storedState)) {
          setStatus("error");
          setErrorMessage("Invalid OAuth state. This may be a security issue. Please try connecting again.");
          // Clean up potentially compromised state
          localStorage.removeItem("github_oauth_state");
          localStorage.removeItem("github_oauth_context");
          clearTimeout(timeoutId);
          return;
        }

        // Clean up state now that it's validated (only for web app flows)
        if (!isCLIOAuth) {
          localStorage.removeItem("github_oauth_state");
        }

        // Check if we've already processed this code to prevent duplicate submissions
        const processedCode = sessionStorage.getItem("github_processed_code");
        if (processedCode === code) {
          setStatus("error");
          setErrorMessage("This authorization code has already been used. Please try connecting again.");
          clearTimeout(timeoutId);
          return;
        }

        // Mark this code as being processed
        sessionStorage.setItem("github_processed_code", code);
        hasProcessed.current = true;

        // Get context information from localStorage
        const contextData = localStorage.getItem("github_oauth_context");
        let context = "personal";
        let projectId = undefined;
        let organizationId = undefined;
        
        // For CLI OAuth flows, always use personal context
        if (isCLIOAuth) {
          context = "personal";
          console.log("CLI OAuth flow detected, using personal context");
        } else if (contextData) {
          try {
            const parsed = JSON.parse(contextData);
            context = parsed.context || "personal";
            projectId = parsed.projectId;
            organizationId = parsed.organizationId;
            // DON'T clean up context data yet - save it for error cases
          } catch (error) {
            // Error parsing context data
          }
        }

        // User is guaranteed to be authenticated at this point since useEffect checks for it
        if (!user) {
          setStatus("error");
          setErrorMessage("Authentication failed. Please refresh the page and try again.");
          clearTimeout(timeoutId);
          return;
        }

        // Exchange code for token
        const response = await fetch("/api/github/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            userId: user.uid,
            context,
            projectId,
            organizationId
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          
          // Handle specific GitHub OAuth errors
          let errorMsg = "Failed to connect to GitHub";
          if (responseData.details) {
            if (responseData.details.includes("bad_verification_code") || 
                responseData.details.includes("incorrect_client_credentials") ||
                responseData.details.includes("expired")) {
              errorMsg = "The authorization code has expired or is invalid. Please try connecting again.";
            } else {
              errorMsg = responseData.details;
            }
          } else if (responseData.error) {
            errorMsg = responseData.error;
          }
          
          throw new Error(errorMsg);
        }

        setStatus("success");
        
        // Clean up processed code tracking and context data on success
        sessionStorage.removeItem("github_processed_code");
        
        // Only clean up context data for non-CLI flows
        if (!isCLIOAuth) {
          localStorage.removeItem("github_oauth_context");
        }
        
        // Set flag to show repository selector after redirect
        localStorage.setItem("github_just_connected", "true");
        
        // Dispatch event for GitHub connection success
        window.dispatchEvent(new CustomEvent('githubConnected', {
          detail: { userId: user.uid, context, projectId, organizationId }
        }));
        
        toast({
          title: "Success",
          description: isCLIOAuth ? "GitHub connected successfully! You can now return to the CLI." : "GitHub connected successfully",
        });

        // For CLI OAuth, show a special message and don't redirect automatically
        if (isCLIOAuth) {
          setRedirectDescription("GitHub connected successfully! You can now return to the CLI and continue.");
          // Don't auto-redirect for CLI flows, let user manually return to CLI
          clearTimeout(timeoutId);
          return;
        }

        // Redirect to appropriate page based on context
        let redirectPath = "/";
        let newRedirectDescription = "Redirecting to dashboard...";
        
        if (context === "project" && projectId) {
          redirectPath = `/projects/${projectId}/repositories`;
          newRedirectDescription = "Redirecting to project repositories...";
        } else {
          redirectPath = "/repositories"; // Redirect to repositories page for personal context
          newRedirectDescription = "Redirecting to repositories...";
        }
        
        setRedirectDescription(newRedirectDescription);
        
        setTimeout(() => {
          router.push(redirectPath);
        }, 2000);
        
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "An unknown error occurred",
        );
      }
    }

    handleGitHubCallback();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, router, toast, status]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>GitHub Connection</CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Connecting to GitHub..."
              : status === "success"
                ? "Successfully connected to GitHub!"
                : "Failed to connect to GitHub"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === "loading" ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p>Processing GitHub authorization...</p>
              {user === undefined && (
                <p className="text-xs text-muted-foreground">Waiting for authentication...</p>
              )}
              {user && (
                <p className="text-xs text-muted-foreground">Exchanging authorization code...</p>
              )}
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p>Your GitHub account has been connected successfully!</p>
              <p className="text-sm text-muted-foreground">
                {redirectDescription}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p>An error occurred while connecting to GitHub:</p>
              <p className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    // Clear processed code tracking
                    sessionStorage.removeItem("github_processed_code");
                    
                    // Get context for redirect from localStorage (not cleaned up on error)
                    const contextData = localStorage.getItem("github_oauth_context");
                    let redirectPath = "/organizations"; // Default to organizations page
                    
                    if (contextData) {
                      try {
                        const parsed = JSON.parse(contextData);
                        if (parsed.context === "project" && parsed.projectId) {
                          redirectPath = `/projects/${parsed.projectId}/settings`;
                        }
                        // Clean up context now that we're leaving
                        localStorage.removeItem("github_oauth_context");
                      } catch (e) {
                        // Error parsing context for retry
                      }
                    } else {
                      // Fallback: try to get context from referrer
                      const referrer = document.referrer;
                      if (referrer) {
                        if (referrer.includes('/projects/') && referrer.includes('/settings')) {
                          const projectMatch = referrer.match(/\/projects\/([^\/]+)/);
                          if (projectMatch) {
                            redirectPath = `/projects/${projectMatch[1]}/settings`;
                          }
                        }
                      }
                    }
                    
                    router.push(redirectPath);
                  }}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button onClick={() => router.push("/")}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
