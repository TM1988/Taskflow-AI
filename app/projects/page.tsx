"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Settings,
  Folder,
  Calendar,
  Users,
  RefreshCw,
  Trash2,
  Building,
  Clock,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
// import ProjectLimitManager from "@/components/projects/project-limit-manager";

const formatDate = (dateValue: any): string => {
  if (!dateValue) return "Unknown";
  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { setWorkspace } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();

  const fetchProjects = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch organizations first
      const orgResponse = await fetch(`/api/organizations?userId=${user.uid}`);
      let orgsData = [];
      
      if (orgResponse.ok) {
        orgsData = await orgResponse.json();
        setOrganizations(orgsData);
      }

      // Fetch all projects across organizations
      const allProjects: any[] = [];
      
      for (const org of orgsData) {
        try {
          const projectResponse = await fetch(`/api/organizations/${org.id}/projects`);
          if (projectResponse.ok) {
            const orgProjects = await projectResponse.json();
            allProjects.push(...orgProjects.map((p: any) => ({ 
              ...p, 
              organizationName: org.name,
              organizationId: org.id 
            })));
          }
        } catch (error) {
          console.error(`Error fetching projects for org ${org.id}:`, error);
        }
      }

      setProjects(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const handleDeleteProject = async (projectId: string, projectName: string, organizationId: string) => {
    if (!user?.uid) return;
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Direct delete the project via API
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Remove from active list
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project Deleted",
        description: `${projectName} has been deleted successfully.`,
      });

      // Refresh to get updated data
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Folder className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Organize your work and collaborate with your team
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchProjects}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Project Limit Manager - Temporarily disabled to reduce API calls */}
      {/* {organizations.length > 0 && (
        <ProjectLimitManager 
          organizationId={organizations[0]?.id || ''}
          projects={projects}
          onCreateProject={() => router.push('/organizations')}
          isOwner={organizations[0]?.isOwner || false}
          userRole={organizations[0]?.userRole || 'member'}
        />
      )} */}

      {projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {project.organizationName}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/projects/${project.id}/settings`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id, project.name, project.organizationId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status || 'Active'}
                  </Badge>
                  {project.priority && (
                    <Badge variant="outline">{project.priority}</Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.memberCount || 1} members</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created {formatDate(project.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (project.organizationId) {
                        setWorkspace('organization', project.organizationId, project.id);
                      }
                      router.push(`/projects/${project.id}`);
                    }}
                  >
                    View Project
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (project.organizationId) {
                        setWorkspace('organization', project.organizationId, project.id);
                      }
                      router.push(`/kanban-board?projectId=${project.id}`);
                    }}
                  >
                    Kanban Board
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by creating a project to organize and track your work.
            You can create projects within organizations or independently.
          </p>
          {organizations.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You need to create an organization first before creating projects.
              </p>
              <Button 
                onClick={() => router.push('/organizations')}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                Go to Organizations
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => router.push('/organizations')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
