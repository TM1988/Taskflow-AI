"use client";

import { useParams } from "next/navigation";

export default function ProjectAnalyticsPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Analytics</h1>
        <p className="text-muted-foreground mt-2">
          View detailed analytics and insights for this project
        </p>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <p>Project analytics coming soon...</p>
        <p className="text-sm mt-2">Project ID: {params.projectId}</p>
      </div>
    </div>
  );
}
