"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/services/auth/AuthContext";
import { onboardingService } from "@/services/onboarding/onboardingService";
import Header from "./header";
import Sidebar from "./sidebar";
import CompactOnboarding from "@/components/onboarding/compact-onboarding";
import { useSidebar } from "@/contexts/SidebarContext";

interface LayoutWrapperProps {
  children: ReactNode;
}

function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isExpanded } = useSidebar();

  // Don't add padding to board page
  const isBoardPage = pathname === "/board" || pathname.startsWith("/board?") || pathname.startsWith("/board/");

  // Only add padding when sidebar is expanded and not on board page
  const shouldAddPadding = isExpanded && !isBoardPage;

  return (
    <main className={`flex-1 overflow-y-auto ${shouldAddPadding ? "pl-6 pr-6 pt-6 pb-6" : ""}`}>
      {children}
    </main>
  );
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  
  // Check if current page should show the layout (sidebar + header)
  const isAuthPage = pathname.startsWith("/auth") || pathname.startsWith("/invite");
  const isLandingPage = pathname === "/landing" || pathname === "/";
  const shouldHideLayout = isAuthPage || isLandingPage;
  
  // Check onboarding status for authenticated users
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !shouldHideLayout && !onboardingChecked) {
        try {
          const needsOnboarding = await onboardingService.needsOnboarding(user.uid);
          setShowOnboarding(needsOnboarding);
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          setShowOnboarding(false);
        } finally {
          setOnboardingChecked(true);
        }
      }
    };

    // Reset check when user changes
    if (!user) {
      setOnboardingChecked(false);
      setShowOnboarding(false);
    } else {
      checkOnboarding();
    }
  }, [user, shouldHideLayout, onboardingChecked]);

  // For auth pages and landing page, don't show sidebar and header
  if (shouldHideLayout) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <MainContent>{children}</MainContent>
      </div>
      
      {/* Compact onboarding that stays visible across all pages */}
      {user && showOnboarding && (
        <CompactOnboarding 
          userId={user.uid} 
          onComplete={() => {
            setShowOnboarding(false);
            setOnboardingChecked(false); // Allow re-checking if onboarding is reset
          }}
        />
      )}
    </div>
  );
}