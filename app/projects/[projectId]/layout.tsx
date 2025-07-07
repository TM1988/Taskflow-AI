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
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`/api/projects/${params.projectId}?t=${Date.now()}`, {
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch project: ${response.status} - ${errorText}`);
          throw new Error(`Failed to fetch project: ${response.status}`);
        }

        let projectData = await response.json();
        
        // Check if user has access to this project
        const isOwner = projectData.ownerId === user.uid;
        const isMember = projectData.members?.includes(user.uid);
        
        // Email-based fallback access check with more robust logic
        let hasEmailAccess = false;
        if (!isOwner && !isMember && user.email) {
          try {
            // Fetch project members with email details for fallback check
            const membersResponse = await fetch(`/api/projects/${params.projectId}/members?t=${Date.now()}`, {
              cache: 'no-cache'
            });
            
            if (membersResponse.ok) {
              const members = await membersResponse.json();
              
              // Check both email and user ID matches
              hasEmailAccess = members.some((member: any) => 
                member.email === user.email || 
                member.id === user.uid ||
                // Additional check for partial email matches (in case of inconsistencies)
                (member.email && user.email && member.email.toLowerCase() === user.email.toLowerCase())
              );
              
              console.log("Email-based access check:", {
                userEmail: user.email,
                userId: user.uid,
                members: members.map((m: any) => ({ id: m.id, email: m.email })),
                hasEmailAccess
              });
              
              // If we found an email match but not a user ID match, there might be a sync issue
              if (hasEmailAccess && !isMember) {
                console.warn("User has email access but is not in project members array - possible sync issue");
                
                // Try to refresh the project data to see if members array is updated
                const refreshResponse = await fetch(`/api/projects/${params.projectId}?refresh=true&t=${Date.now()}`, {
                  cache: 'no-cache'
                });
                
                if (refreshResponse.ok) {
                  const refreshedProjectData = await refreshResponse.json();
                  const isRefreshedMember = refreshedProjectData.members?.includes(user.uid);
                  
                  console.log("Refreshed member check:", {
                    originalMembers: projectData.members,
                    refreshedMembers: refreshedProjectData.members,
                    isRefreshedMember
                  });
                  
                  // Update our project data if the refreshed version shows user as member
                  if (isRefreshedMember) {
                    projectData = refreshedProjectData;
                  }
                }
              }
            }
          } catch (emailCheckError) {
            console.error("Email access check failed:", emailCheckError);
          }
        }
        
        console.log("Project access check:", {
          projectId: params.projectId,
          userId: user.uid,
          userEmail: user.email,
          isOwner,
          isMember: projectData.members?.includes(user.uid), // Re-check after potential refresh
          hasEmailAccess,
          finalAccess: isOwner || projectData.members?.includes(user.uid) || hasEmailAccess,
          ownerId: projectData.ownerId,
          members: projectData.members
        });
        
        // Final access check using the potentially updated projectData
        const finalIsMember = projectData.members?.includes(user.uid);
        
        if (!isOwner && !finalIsMember && !hasEmailAccess) {
          console.warn("User does not have access to this project");
          console.log("Project data:", {
            ownerId: projectData.ownerId,
            members: projectData.members,
            userId: user.uid,
            userEmail: user.email
          });
          toast({
            title: "Access Denied",
            description: "You don't have access to this project. Please check if you've been added to the project team by the project owner. If you were just added, please wait a moment and try refreshing the page, as it may take time to sync.",
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
          description: "Failed to load project. Please try refreshing the page.",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.projectId, user?.uid, router, setWorkspace, toast]); // Simplified dependencies

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
