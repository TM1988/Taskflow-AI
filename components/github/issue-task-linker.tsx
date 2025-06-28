'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Link as LinkIcon, ExternalLink, Calendar, User, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  projectId?: string;
  columnId?: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

interface TaskIssueLink {
  id: string;
  taskId: string;
  issueId: number;
  issueNumber: number;
  repositoryName: string;
  linkedAt: string;
}

interface IssueTaskLinkerProps {
  repositoryOwner: string;
  repositoryName: string;
  issues: Issue[];
}

export default function IssueTaskLinker({ 
  repositoryOwner, 
  repositoryName, 
  issues 
}: IssueTaskLinkerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskIssueLinks, setTaskIssueLinks] = useState<TaskIssueLink[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(user?.uid && { 'x-user-id': user.uid })
      };

      // Fetch tasks and existing links
      const [tasksRes, linksRes] = await Promise.all([
        fetch('/api/tasks', { headers }),
        fetch('/api/github/issue-links', { headers }),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || tasksData || []);
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        // Filter links for this specific repository
        const repoLinks = linksData.links?.filter((link: TaskIssueLink) => 
          link.repositoryName === `${repositoryOwner}/${repositoryName}`
        ) || [];
        setTaskIssueLinks(repoLinks);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const linkTaskToIssue = async () => {
    if (!selectedTask || !selectedIssue) {
      toast({
        title: "Error",
        description: "Please select both a task and an issue.",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(user?.uid && { 'x-user-id': user.uid })
      };

      const selectedIssueData = issues.find(issue => issue.id.toString() === selectedIssue);
      if (!selectedIssueData) {
        throw new Error('Selected issue not found');
      }

      const response = await fetch('/api/github/issue-links', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          taskId: selectedTask,
          issueId: selectedIssueData.id,
          issueNumber: selectedIssueData.number,
          repositoryName: `${repositoryOwner}/${repositoryName}`,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task linked to GitHub issue successfully!",
        });
        setSelectedTask('');
        setSelectedIssue('');
        setIsDialogOpen(false);
        fetchData(); // Refresh the data
      } else {
        throw new Error('Failed to link task to issue');
      }
    } catch (error) {
      console.error('Error linking task to issue:', error);
      toast({
        title: "Error",
        description: "Failed to link task to issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkTaskFromIssue = async (linkId: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(user?.uid && { 'x-user-id': user.uid })
      };

      const response = await fetch(`/api/github/issue-links/${linkId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task unlinked from issue successfully!",
        });
        fetchData(); // Refresh the data
      } else {
        throw new Error('Failed to unlink task from issue');
      }
    } catch (error) {
      console.error('Error unlinking task from issue:', error);
      toast({
        title: "Error",
        description: "Failed to unlink task from issue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  const getIssueByNumber = (issueNumber: number) => {
    return issues.find(issue => issue.number === issueNumber);
  };

  const getTaskPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Link Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-500" />
            Link Issues to Tasks
          </CardTitle>
          <CardDescription>
            Connect GitHub issues to your tasks for better project tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Link Issue to Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Link GitHub Issue to Task</DialogTitle>
                <DialogDescription>
                  Select a task and an issue to create a link between them.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Task</label>
                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.length === 0 ? (
                        <SelectItem value="no-tasks" disabled>
                          No tasks available
                        </SelectItem>
                      ) : (
                        tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            <div className="flex items-center gap-2">
                              {task.priority && (
                                <div className={`w-2 h-2 rounded-full ${getTaskPriorityColor(task.priority)}`} />
                              )}
                              <span className="truncate">{task.title}</span>
                              {task.status && (
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Issue</label>
                  <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an issue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {issues.length === 0 ? (
                        <SelectItem value="no-issues" disabled>
                          No issues available
                        </SelectItem>
                      ) : (
                        issues.map((issue) => (
                          <SelectItem key={issue.id} value={issue.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Badge variant={issue.state === 'open' ? 'destructive' : 'secondary'}>
                                #{issue.number}
                              </Badge>
                              <span className="truncate">{issue.title}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={linkTaskToIssue}
                  disabled={!selectedTask || !selectedIssue || isLinking}
                >
                  {isLinking ? "Linking..." : "Link Task to Issue"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Existing Links Section */}
      {taskIssueLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Links</CardTitle>
            <CardDescription>
              Current task-issue connections for this repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskIssueLinks.map((link) => {
                const task = getTaskById(link.taskId);
                const issue = getIssueByNumber(link.issueNumber);

                return (
                  <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">
                            Task: {task?.title || `Task ID: ${link.taskId}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Issue: #{link.issueNumber} {issue?.title || 'Issue not found'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Linked {new Date(link.linkedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {issue && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(issue.html_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Issue
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unlinkTaskFromIssue(link.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Unlink
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Tasks Available Message */}
      {tasks.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Tasks Available</p>
              <p className="text-sm">
                Create some tasks first to link them with GitHub issues.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
