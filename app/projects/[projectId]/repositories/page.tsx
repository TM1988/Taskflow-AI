// app/projects/[projectId]/repositories/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import GitHubConnectionManager from "@/components/github/GitHubConnectionManager";

export default function ProjectRepositoriesPage() {
  const params = useParams();
  const { currentProject, currentOrganization } = useWorkspace();
  const projectId = params.projectId as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Repositories</h1>
        <p className="text-muted-foreground mt-2">
          Manage GitHub repositories for {currentProject?.name || "this project"}
        </p>
      </div>

      {/* GitHub Connection and Repository Management */}
      <GitHubConnectionManager 
        projectId={projectId}
        organizationId={currentOrganization?.id}
        context="project"
        showRepositoryManager={true}
      />
    </div>
  );
}
