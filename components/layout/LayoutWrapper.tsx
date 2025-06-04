"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/AuthContext";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Pages that should NOT have the main layout (header + sidebar)
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth'];
  const isAuthPage = authPages.includes(pathname) || pathname.startsWith('/auth');
  
  console.log("LayoutWrapper DEBUG:", {
    pathname,
    isAuthPage,
    hasUser: !!user,
    loading,
    authPagesArray: authPages
  });

  // Handle auth redirects properly
  useEffect(() => {
    if (loading) return; // Don't redirect while loading
    
    // If user is not authenticated
    if (!user) {
      // If they're on root path or any non-auth page, redirect to login
      if (pathname === '/' || !isAuthPage) {
        console.log("Redirecting unauthenticated user to login from:", pathname);
        router.push('/auth/login');
        return;
      }
      
      // If they're on /auth (bare), redirect to login
      if (pathname === '/auth') {
        console.log("Redirecting from /auth to /auth/login");
        router.push('/auth/login');
        return;
      }
    } else {
      // If user IS authenticated
      // If they're on an auth page, redirect to dashboard
      if (isAuthPage) {
        console.log("Redirecting authenticated user to dashboard from:", pathname);
        router.push('/');
        return;
      }
    }
  }, [loading, user, isAuthPage, router, pathname]);
  
  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Don't show header/sidebar on auth pages
  if (isAuthPage) {
    console.log("Showing auth page layout for:", pathname);
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // If user is not authenticated, show loading while redirect happens
  if (!user) {
    console.log("Showing loading while redirecting unauthenticated user from:", pathname);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Regular app pages: Show header and sidebar (only for authenticated users)
  console.log("Showing dashboard layout for authenticated user:", pathname);
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
