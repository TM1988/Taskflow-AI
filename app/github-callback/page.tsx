// app/github-callback/page.tsx
"use client";

import { useEffect, useState } from "react";
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
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function handleGitHubCallback() {
      // Check if user is authenticated
      if (!user) {
        console.log("No authenticated user found");
        setStatus("error");
        setErrorMessage("You must be logged in to connect GitHub");
        return;
      }

      console.log("Authenticated user:", {
        uid: user.uid,
        email: user.email,
        isAnonymous: user.isAnonymous,
      });

      try {
        // Get query params from URL
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const code = urlParams.get("code");

        if (!code) {
          console.error("No code found in URL");
          setStatus("error");
          setErrorMessage("No authorization code received from GitHub");
          return;
        }

        console.log("GitHub code received, exchanging for token...");

        // Exchange code for token
        const response = await fetch("/api/github/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            userId: user.uid,
          }),
        });

        const responseData = await response.json();

        console.log("Token exchange response status:", response.status);

        if (!response.ok) {
          console.error("Token exchange failed:", responseData);
          throw new Error(
            responseData.details ||
              responseData.error ||
              "Failed to exchange code for token",
          );
        }

        setStatus("success");
        toast({
          title: "Success",
          description: "GitHub connected successfully",
        });

        // Redirect back to dashboard
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        console.error("Error handling GitHub callback:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "An unknown error occurred",
        );
      }
    }

    handleGitHubCallback();
  }, [user, router, toast]);

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
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p>Your GitHub account has been connected successfully!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p>An error occurred while connecting to GitHub:</p>
              <p className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
              <Button onClick={() => router.push("/")}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
