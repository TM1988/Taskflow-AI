"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";

interface ProjectSettingsPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const [project, setProject] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshOrganizations } = useWorkspace();
  const router = useRouter();

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${params.projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
        setFormData({
          name: projectData.name || "",
          description: projectData.description || "",
        });

        // Fetch organization data if project belongs to one
        if (projectData.organizationId) {
          const orgResponse = await fetch(
            `/api/organizations/${projectData.organizationId}`
          );
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            setOrganization(orgData);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && params.projectId) {
      fetchProjectData();
    }
  }, [params.projectId, user, fetchProjectData]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const updatedProject = await response.json();
      setProject(updatedProject);

      // Refresh organizations in context to update everywhere
      await refreshOrganizations();

      toast({
        title: "Success",
        description: "Project settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      // Refresh organizations to update dropdown and counts
      await refreshOrganizations();

      // Redirect to organization page or personal projects
      if (organization) {
        router.push(`/organizations/${organization.id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Project Settings</h1>
          <p className="text-muted-foreground">
            Manage your project configuration and settings
          </p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter project description"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        {/* Project Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Project ID</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.id}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Owner</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.ownerName || project.ownerEmail || "Unknown"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.createdAt
                  ? typeof project.createdAt === 'object' && project.createdAt.seconds
                    ? new Date(project.createdAt.seconds * 1000).toLocaleDateString()
                    : new Date(project.createdAt).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {project.updatedAt
                  ? typeof project.updatedAt === 'object' && project.updatedAt.seconds
                    ? new Date(project.updatedAt.seconds * 1000).toLocaleDateString()
                    : new Date(project.updatedAt).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Delete Project</h3>
              <p className="text-sm text-muted-foreground">
                Once you delete a project, there is no going back. This action
                cannot be undone. All tasks, data, and settings associated with
                this project will be permanently deleted.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Project"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    project &quot;{project.name}&quot; and remove all of its data
                    from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
