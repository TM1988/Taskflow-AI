"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to dashboard when accessing project root
    if (params.projectId) {
      router.replace(`/projects/${params.projectId}/dashboard`);
    }
  }, [router, params.projectId]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Redirecting to project dashboard...</div>
    </div>
  );
}
