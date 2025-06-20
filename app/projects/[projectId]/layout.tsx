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
        console.log(`Fetching project ${params.projectId} for user ${user.uid}`);
        console.log(`Current workspace context: workspace=${currentWorkspace}, org=${currentOrganization?.id}, project=${currentProject?.id}`);
        
        const response = await fetch(`/api/projects/${params.projectId}`);
        
        console.log(`Project API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch project: ${response.status} - ${errorText}`);
          console.error(`Project ID that failed: ${params.projectId}`);
          throw new Error(`Failed to fetch project: ${response.status}`);
        }

        const projectData = await response.json();
        console.log(`Project data received:`, projectData);
        
        // Check if user has access to this project
        const isOwner = projectData.ownerId === user.uid;
        const isMember = projectData.members?.includes(user.uid);
        
        console.log(`Access check - isOwner: ${isOwner}, isMember: ${isMember}`);
        
        if (!isOwner && !isMember) {
          console.warn("User does not have access to this project");
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
        
        console.log(`Workspace context check - currentlyCorrect: ${currentlyCorrect}, currentWorkspace: ${currentWorkspace}, projectOrgId: ${projectData.organizationId}`);
        
        if (!currentlyCorrect) {
          console.log(`ProjectLayout: Setting workspace context for project ${projectData.id} in org ${projectData.organizationId}`);
          if (projectData.organizationId) {
            await setWorkspace('organization', projectData.organizationId, projectData.id);
          } else {
            await setWorkspace('personal', undefined, projectData.id);
          }
          console.log(`ProjectLayout: Workspace context set successfully`);
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
