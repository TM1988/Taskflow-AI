// app/test-github-callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { githubRepositoryService } from "@/services/github/repositoryService";
import { useAuth } from "@/services/auth/AuthContext";

export default function TestGitHubCallbackPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const setupPersonalGitHubOAuth = async () => {
    if (!user?.uid) {
      addLog("❌ No user authenticated");
      return;
    }

    addLog("🚀 Starting PERSONAL GitHub OAuth flow...");
    
    try {
      const authUrl = await githubRepositoryService.connectGitHub(user.uid, "personal");
      addLog(`✅ Personal OAuth URL created`);
      addLog(`🔄 Redirecting to GitHub...`);
      
      // Redirect to GitHub for REAL OAuth
      setTimeout(() => {
        window.location.href = authUrl;
      }, 1000);
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const setupOrganizationGitHubOAuth = async () => {
    if (!user?.uid) {
      addLog("❌ No user authenticated");
      return;
    }

    addLog("🚀 Starting ORGANIZATION GitHub OAuth flow...");
    
    try {
      const authUrl = await githubRepositoryService.connectGitHub(
        user.uid, 
        "organization", 
        undefined, 
        "UrMlA5Cw3aTlQwQmfkqn"
      );
      addLog(`✅ Organization OAuth URL created`);
      addLog(`🔄 Redirecting to GitHub...`);
      
      // Redirect to GitHub for REAL OAuth
      setTimeout(() => {
        window.location.href = authUrl;
      }, 1000);
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem("github_oauth_state");
    localStorage.removeItem("github_oauth_context");
    sessionStorage.removeItem("github_processed_code");
    addLog("🧹 Cleared all OAuth storage");
  };

  const checkConnection = async () => {
    if (!user?.uid) {
      addLog("❌ No user authenticated");
      return;
    }

    addLog("🔍 Checking GitHub connection status...");
    
    try {
      const personalConnected = await githubRepositoryService.checkConnection(user.uid, "personal");
      const orgConnected = await githubRepositoryService.checkConnection(user.uid, "organization");
      
      addLog(`📊 Personal: ${personalConnected ? '✅ Connected' : '❌ Not connected'}`);
      addLog(`📊 Organization: ${orgConnected ? '✅ Connected' : '❌ Not connected'}`);
    } catch (error) {
      addLog(`❌ Error checking connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check connection on mount
  useEffect(() => {
    if (user?.uid) {
      addLog(`👤 User authenticated: ${user.email}`);
      checkConnection();
    }
  }, [user, checkConnection]);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>GitHub OAuth Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={setupPersonalGitHubOAuth} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!user}
            >
              🔵 Personal GitHub OAuth
            </Button>
            <Button 
              onClick={setupOrganizationGitHubOAuth} 
              className="bg-green-600 hover:bg-green-700"
              disabled={!user}
            >
              � Organization GitHub OAuth
            </Button>
            <Button onClick={checkConnection} variant="outline" disabled={!user}>
              🔍 Check Connection
            </Button>
            <Button onClick={clearStorage} variant="outline">
              🧹 Clear Storage
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Logs:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Instructions for GitHub OAuth:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Choose either Personal or Organization OAuth</li>
              <li>You&apos;ll be redirected to GitHub.com for authorization</li>
              <li>Authorize the Taskflow AI app on GitHub</li>
              <li>You&apos;ll be redirected back with a REAL authorization code</li>
              <li>The system will automatically handle the token exchange</li>
              <li>Use &quot;Check Connection&quot; to verify the connection status</li>
            </ol>
            <p className="mt-2 text-green-600 font-medium">
              ✅ This creates a REAL GitHub connection using the new unified system!
            </p>
          </div>

          {!user && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
              <p className="text-yellow-800">Please log in to test GitHub OAuth connection.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
