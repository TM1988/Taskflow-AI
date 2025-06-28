"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, User, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserWorkloadProps {
  projectId: string;
}

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface WorkloadData {
  assignedTasks: number;
  taskLimit: number;
  workloadPercentage: number;
  tasks: TaskData[];
  completedThisWeek: number;
  overdueTasks: number;
}

export default function UserWorkload({ projectId }: UserWorkloadProps) {
  const [workloadData, setWorkloadData] = useState<WorkloadData | null>(null);
  const [taskLimit, setTaskLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && projectId && projectId !== "personal") {
      fetchUserWorkload();
    } else {
      setLoading(false);
    }
  }, [user, projectId]);

  const fetchUserWorkload = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/member-workload?projectId=${projectId}&memberId=${user?.uid}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setWorkloadData(data);
        setTaskLimit(data.taskLimit || 10);
      } else {
        console.error("Failed to fetch user workload");
      }
    } catch (error) {
      console.error("Error fetching user workload:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskLimit = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/projects/${projectId}/members/${user?.uid}/task-limit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskLimit }),
      });

      if (response.ok) {
        await fetchUserWorkload();
        toast({
          title: "Success",
          description: "Task limit updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update task limit",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task limit:", error);
      toast({
        title: "Error",
        description: "Failed to update task limit",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getWorkloadStatus = () => {
    if (!workloadData) return { color: "gray", text: "Loading..." };
    
    const percentage = workloadData.workloadPercentage;
    if (percentage >= 90) return { color: "red", text: "Overloaded" };
    if (percentage >= 70) return { color: "yellow", text: "High Workload" };
    if (percentage >= 30) return { color: "green", text: "Balanced" };
    return { color: "blue", text: "Available" };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Card>
    );
  }

  if (projectId === "personal") {
    return (
      <Card className="p-6">
        <Alert>
          <User className="h-4 w-4" />
          <AlertTitle>Personal Project</AlertTitle>
          <AlertDescription>
            Workload management is only available for team projects.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  const status = getWorkloadStatus();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <User className="h-6 w-6" />
          Your Project Workload
        </h2>
        
        <div className="space-y-6">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Your Task Management</AlertTitle>
            <AlertDescription>
              View and manage your personal task limits and workload within this project.
            </AlertDescription>
          </Alert>

          {/* User Workload Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {workloadData?.assignedTasks || 0}
                </div>
                <div className="text-sm text-muted-foreground">Assigned Tasks</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {workloadData?.taskLimit || taskLimit}
                </div>
                <div className="text-sm text-muted-foreground">Task Limit</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  status.color === "red" ? "text-red-600" :
                  status.color === "yellow" ? "text-yellow-600" :
                  status.color === "green" ? "text-green-600" :
                  "text-blue-600"
                }`}>
                  {Math.round(workloadData?.workloadPercentage || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">Workload</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {workloadData?.completedThisWeek || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed This Week</div>
              </div>
            </Card>
          </div>

          {/* Workload Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Workload Progress</Label>
              <Badge variant={status.color === "red" ? "destructive" : "secondary"}>
                {status.text}
              </Badge>
            </div>
            <Progress 
              value={workloadData?.workloadPercentage || 0} 
              className="h-2"
            />
          </div>

          {/* Task Limit Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Task Limit Settings</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="taskLimit">Your Task Limit</Label>
                <Input
                  id="taskLimit"
                  type="number"
                  value={taskLimit}
                  onChange={(e) => setTaskLimit(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of active tasks you can handle at once
                </p>
              </div>
              
              <Button 
                onClick={updateTaskLimit} 
                disabled={updating}
                className="mb-6"
              >
                {updating ? "Updating..." : "Update Task Limit"}
              </Button>
            </div>
          </div>

          {/* Current Tasks */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Current Tasks</h3>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {workloadData?.tasks && workloadData.tasks.length > 0 ? (
                <div className="space-y-2">
                  {workloadData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">{task.status}</Badge>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No tasks assigned to you in this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Workload Insights */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Workload Insights</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {status.color === "blue" && (
                <Card className="p-4">
                  <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Available Capacity
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You have {(workloadData?.taskLimit || taskLimit) - (workloadData?.assignedTasks || 0)} available task slots. 
                    You&apos;re ready to take on new work!
                  </p>
                </Card>
              )}
              
              {status.color === "red" && (
                <Card className="p-4">
                  <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Overloaded
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re at {Math.round(workloadData?.workloadPercentage || 0)}% capacity. 
                    Consider completing some tasks or increasing your limit.
                  </p>
                </Card>
              )}
              
              <Card className="p-4">
                <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Productivity Status
                </h4>
                <p className="text-sm text-muted-foreground">
                  {workloadData?.completedThisWeek ? 
                    `You completed ${workloadData.completedThisWeek} tasks this week. Great progress!` :
                    "No tasks completed this week yet. Keep working towards your goals!"
                  }
                </p>
              </Card>

              {workloadData?.overdueTasks && workloadData.overdueTasks > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue Tasks
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You have {workloadData.overdueTasks} overdue tasks. Consider prioritizing these first.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
