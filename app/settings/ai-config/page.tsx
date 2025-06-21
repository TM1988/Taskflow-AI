"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIConfigPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page with AI tab
    router.replace('/settings?tab=ai');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to AI settings...</p>
      </div>
    </div>
  );
}
