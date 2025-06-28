"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Settings,
  Users,
  Calendar,
  BarChart3,
  Plus,
  User,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BoardContent from "@/components/board/board-content";

interface ProjectDetailPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [project, setProject] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("board");
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${params.projectId}`);
      
      if (!projectResponse.ok) {
        if (projectResponse.status === 404) {
          toast({
            title: "Project Not Found",
            description: "This project does not exist or has been deleted",
            variant: "destructive",
          });
          router.push("/organizations");
          return;
        }
        throw new Error("Failed to load project");
      }

      const projectData = await projectResponse.json();
      
      // Check if user has access to this project
      const isOwner = projectData.ownerId === user?.uid;
      const isMember = projectData.members?.includes(user?.uid);
      
      if (!isOwner && !isMember) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this project",
          variant: "destructive",
        });
        router.push("/organizations");
        return;
      }

      setProject(projectData);

      // Fetch organization details if project has organizationId
      if (projectData.organizationId) {
        const orgResponse = await fetch(`/api/organizations/${projectData.organizationId}`);
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setOrganization(orgData);
        }
      }

      // Fetch tasks for this project
      const tasksResponse = await fetch(`/api/projects/${params.projectId}/tasks`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
      router.push("/organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && params.projectId) {
      fetchProjectData();
    }
  }, [params.projectId, user]);

  const formatDate = (dateValue: any) => {
    try {
      if (!dateValue) return "Unknown date";
      
      if (dateValue && typeof dateValue.toDate === "function") {
        return dateValue.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Unknown date";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long", 
        day: "numeric"
      });
    } catch {
      return "Unknown date";
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === "done").length;
    const inProgress = tasks.filter(task => task.status === "in-progress").length;
    const todo = tasks.filter(task => task.status === "todo").length;
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === "done") return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date();
    }).length;

    return { total, completed, inProgress, todo, overdue };
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

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">Project Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/organizations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  const stats = getTaskStats();

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (organization) {
              router.push(`/organizations/${organization.id}`);
            } else {
              router.push("/organizations");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {organization ? `Back to ${organization.name}` : "Back"}
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {organization && (
              <span>in {organization.name}</span>
            )}
            <span>Created {formatDate(project.createdAt)}</span>
            <span>{project.members?.length || 1} members</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Project Description */}
      {project.description && (
        <Card className="p-4 mb-6">
          <p className="text-muted-foreground">{project.description}</p>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Circle className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Circle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.todo}</p>
              <p className="text-sm text-muted-foreground">To Do</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-6">
          <BoardContent 
            projectId={params.projectId}
            organizationId={project.organizationId}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Owner:</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {project.ownerName || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {project.status || "Active"}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="text-center py-8 text-muted-foreground">
                No recent activity to display
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Members ({project.members?.length || 1})</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          <div className="grid gap-4">
            {project.members?.map((memberId: string) => (
              <Card key={memberId} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {memberId === project.ownerId ? "Project Owner" : "Member"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {memberId === user?.uid ? "You" : memberId}
                    </p>
                  </div>
                  {memberId === project.ownerId && (
                    <Badge variant="default">Owner</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Task Completion</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Task Distribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>To Do</span>
                  <span>{stats.todo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>In Progress</span>
                  <span>{stats.inProgress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{stats.completed}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Overdue</span>
                  <span>{stats.overdue}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
