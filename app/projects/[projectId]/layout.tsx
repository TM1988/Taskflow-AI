"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setWorkspace, currentWorkspace, currentOrganization, currentProject } = useWorkspace();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !params.projectId) return;

      try {
        const response = await fetch(`/api/projects/${params.projectId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch project: ${response.status} - ${errorText}`);
          throw new Error(`Failed to fetch project: ${response.status}`);
        }

        const projectData = await response.json();
        
        // Check if user has access to this project
        const isOwner = projectData.ownerId === user.uid;
        const isMember = projectData.members?.includes(user.uid);
        
        if (!isOwner && !isMember) {
          console.warn("User does not have access to this project");
          console.log("Project data:", {
            ownerId: projectData.ownerId,
            members: projectData.members,
            userId: user.uid
          });
          toast({
            title: "Access Denied",
            description: "You don't have access to this project",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        setProject(projectData);
        
        // Update workspace context with project information only if not already set correctly
        const currentlyCorrect = (
          (projectData.organizationId && 
           currentWorkspace === 'organization' &&
           currentOrganization?.id === projectData.organizationId &&
           currentProject?.id === projectData.id) ||
          (!projectData.organizationId && 
           currentWorkspace === 'personal')
        );
        
        if (!currentlyCorrect) {
          if (projectData.organizationId) {
            await setWorkspace('organization', projectData.organizationId, projectData.id);
          } else {
            await setWorkspace('personal', undefined, projectData.id);
          }
        }

      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.projectId, user, currentOrganization?.id, currentProject?.id, currentWorkspace, router, setWorkspace, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Project not found</div>
      </div>
    );
  }

  return children;
}
