"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ProtectedRoute } from "@/services/auth/ProtectedRoute";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const [clientSide, setClientSide] = useState(false);

  // This ensures we're rendering on the client side
  useEffect(() => {
    setClientSide(true);
  }, []);

  // If we're still in server rendering, show a simple loading state
  if (!clientSide) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {!isAuthPage && <Sidebar />}
        <div className="flex-1 flex flex-col">
          {!isAuthPage && <Header />}
          <main
            className={`flex-1 ${isAuthPage ? "" : "p-4 md:p-6"} overflow-auto`}
          >
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
