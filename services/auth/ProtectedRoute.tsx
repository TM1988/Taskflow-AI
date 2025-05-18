"use client";

import { useAuth } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to handle cases where auth is taking too long
  useEffect(() => {
    // Set loading timeout to false initially
    setLoadingTimeout(false);

    // If we're still loading after 5 seconds, show a different message
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Auth loading timeout reached - might be stuck");
        setLoadingTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Add more detailed logging
  useEffect(() => {
    console.log("ProtectedRoute state:", {
      isLoading: loading,
      hasUser: !!user,
      currentPath: pathname,
      isAuthPath: pathname.startsWith("/auth"),
    });
  }, [loading, user, pathname]);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith("/auth")) {
      console.log("No authenticated user found, redirecting to login");
      router.push("/auth/login");
    }
  }, [user, loading, router, pathname]);

  // Show improved loading state while checking auth
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {loadingTimeout
            ? "Taking longer than expected... You may need to refresh the page."
            : "Loading your dashboard..."}
        </p>
        {loadingTimeout && (
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary underline mt-2"
            >
              Refresh Page
            </button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="mt-2"
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    );
  }

  // If on auth page, or user is authenticated, show the content
  if (pathname.startsWith("/auth") || user) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
