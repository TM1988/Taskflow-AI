// components/dashboard/repository-list.tsx
"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import PersonalRepositoryManager from "@/components/github/PersonalRepositoryManager";
import ImportedRepositoriesDisplay from "@/components/github/ImportedRepositoriesDisplay";

interface RepositoryListProps {
  projectId?: string;
}

export default function RepositoryList({ projectId }: RepositoryListProps) {
  const { currentWorkspace } = useWorkspace();
  
  // For personal workspace, show all accessible repositories
  if (currentWorkspace === 'personal') {
    return (
      <PersonalRepositoryManager context="personal" />
    );
  }

  // For project workspace, show imported repositories (existing logic)
  return (
    <ImportedRepositoriesDisplay
      title="Imported Repositories"
      description="GitHub repositories linked to your projects"
      showSearch={false}
      emptyMessage="No imported repositories yet. Link repositories to projects to see them here."
      className="h-full"
    />
  );
}
