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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ArrowLeft, Trash2, Save, AlertTriangle, ExternalLink, CheckCircle, Play, Sparkles, Settings, LayoutGrid, Users, Clock } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import ColumnManager from "@/components/board/column-manager";
import GitHubConnect from "@/components/github/GitHubConnect";
import ProjectRepositoryManager from "@/components/projects/ProjectRepositoryManager";
import { cn } from "@/lib/utils";

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

  // AI configuration state
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

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
        console.log("Project data in settings:", projectData);
        console.log("Task count:", projectData.taskCount);
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

  // Fetch AI config when component mounts
  useEffect(() => {
    const fetchAIConfig = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/user-ai-config/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.isEnabled || false);
          setCurrentKey(data.hasApiKey ? "••••••••••••••••" : null);
        }
      } catch (error) {
        console.error("Error fetching AI config:", error);
      }
    };

    fetchAIConfig();
  }, [user]);

  const saveAIConfig = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user-ai-config/${user.uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          isEnabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (apiKey) {
          setCurrentKey("••••••••••••••••");
          setApiKey("");
        }
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
        toast({
          title: "Success",
          description: "AI configuration saved",
        });
      } else {
        throw new Error("Failed to save AI configuration");
      }
    } catch (error) {
      console.error("Error saving AI config:", error);
      toast({
        title: "Error",
        description: "Failed to save AI configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

      <div className="max-w-4xl">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Integration
            </TabsTrigger>
            <TabsTrigger value="repositories" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Repositories
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-6">
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
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                AI Integration Settings
              </h2>
              <div className="space-y-6">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">
                    Privacy Notice
                  </AlertTitle>
                  <AlertDescription className="text-amber-700">
                    When enabled, task data will be sent to Google AI for
                    analysis. Google may save and use this data to improve their
                    services. Please review
                    <a
                      href="https://ai.google.dev/docs/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline ml-1"
                    >
                      Google&apos;s privacy policy
                    </a>{" "}
                    before enabling this feature.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="apiKey">Google AI Studio API Key</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() =>
                        window.open(
                          "https://aistudio.google.com/app/apikeys",
                          "_blank",
                        )
                      }
                    >
                      Get API Key <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={currentKey || "Enter your API key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {currentKey
                      ? "API key is saved. Enter a new key to update it."
                      : "Your API key is stored securely and never shared."}
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="ai-enabled">Enable AI Features</Label>
                  <Switch
                    id="ai-enabled"
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                    disabled={!currentKey && !apiKey}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">How to get your API key:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                    <li>
                      Visit{" "}
                      <a
                        href="https://aistudio.google.com/app/apikeys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google AI Studio
                      </a>
                    </li>
                    <li>Sign in with your Google account</li>
                    <li>Click &quot;Create API Key&quot;</li>
                    <li>Copy the key and paste it here</li>
                  </ol>
                </div>

                <div className="flex justify-between items-center">
                  <Button onClick={saveAIConfig} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save AI Configuration"}
                  </Button>
                  {configSaved && (
                    <span className="text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-right-5">
                      <CheckCircle className="h-4 w-4" />
                      Configuration saved
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* AI Features Demo Box */}
            <Card className="p-6 mt-4">
              <h2 className="text-xl flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-green-500" />
                AI Features Demo
              </h2>
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium mb-2">Current AI Status:</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      "rounded-full h-3 w-3",
                      isEnabled && currentKey ? "bg-green-500" : "bg-red-500",
                    )}
                  ></div>
                  {isEnabled && currentKey ? (
                    <span className="text-green-600 dark:text-green-400">
                      AI features are enabled and ready to use
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      {!currentKey
                        ? "Missing API key"
                        : "AI features are disabled"}
                    </span>
                  )}
                </div>

                {isEnabled && currentKey ? (
                  <div className="mt-4 text-sm">
                    <p className="mb-2">
                      AI features available in your project:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Task prioritization suggestions</li>
                      <li>Automatic task tagging</li>
                      <li>Sprint planning assistance</li>
                      <li>Intelligent work estimates</li>
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>To enable AI features:</p>
                    <ol className="list-decimal pl-5 space-y-1 mt-2">
                      <li>Add your Google AI API key above</li>
                      <li>Toggle &quot;Enable AI Features&quot;</li>
                      <li>Save your configuration</li>
                    </ol>
                  </div>
                )}

                {/* Add a direct link to see AI in action */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projects/${params.projectId}`)}
                    disabled={!isEnabled || !currentKey}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    See AI in Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="repositories">
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">
                  Repository Access
                </h2>
                <ProjectRepositoryManager 
                  projectId={params.projectId}
                  organizationId={project?.organizationId}
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kanban">
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">
                  Kanban Board Configuration
                </h2>
                <ColumnManager projectId={params.projectId} />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="danger">
            <div className="space-y-4">
              <Card className="border-destructive p-6">
                <h2 className="text-2xl font-semibold mb-6 text-destructive">
                  Danger Zone
                </h2>
                
                <Alert className="border-destructive mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    The actions in this section are irreversible and will permanently delete data.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {/* Delete Project */}
                  <div className="border border-destructive rounded-lg p-4">
                    <h3 className="text-lg font-medium text-destructive mb-2">
                      Delete Project
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete this project and all its tasks, columns, and data. 
                      This action cannot be undone.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleting}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            &quot;{project?.name}&quot; and all of its data including:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>All tasks and their attachments</li>
                              <li>All columns and board configurations</li>
                              <li>All project settings and integrations</li>
                              <li>All task history and comments</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleting ? "Deleting..." : "Delete Project"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Continue with other tabs... */}
        </Tabs>
      </div>
    </div>
  );
}
                 