'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitCommit, GitPullRequest, Link as LinkIcon, ExternalLink, Calendar, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";

interface Task {
  id: string;
  title: string;
  status: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  html_url: string;
}

interface TaskCommitLink {
  taskId: string;
  commitSha: string;
  repositoryName: string;
  linkedAt: string;
}

interface RepositoryTaskLinkerProps {
  repositoryOwner: string;
  repositoryName: string;
  commits: Commit[];
  pullRequests: PullRequest[];
}

export default function RepositoryTaskLinker({ 
  repositoryOwner, 
  repositoryName, 
  commits, 
  pullRequests 
}: RepositoryTaskLinkerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCommitLinks, setTaskCommitLinks] = useState<TaskCommitLink[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedCommit, setSelectedCommit] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
        fetch('/api/github/task-links', { headers }),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        // Filter links for this specific repository
        const repoLinks = linksData.links?.filter((link: TaskCommitLink) => 
          link.repositoryName === `${repositoryOwner}/${repositoryName}`
        ) || [];
        setTaskCommitLinks(repoLinks);
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

  const linkTaskToCommit = async () => {
    if (!selectedTask || !selectedCommit) {
      toast({
        title: "Error",
        description: "Please select both a task and a commit.",
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

      const response = await fetch('/api/github/task-links', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          taskId: selectedTask,
          commitSha: selectedCommit,
          repositoryName: `${repositoryOwner}/${repositoryName}`,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task linked to commit successfully!",
        });
        setSelectedTask('');
        setSelectedCommit('');
        fetchData(); // Refresh the data
      } else {
        throw new Error('Failed to link task to commit');
      }
    } catch (error) {
      console.error('Error linking task to commit:', error);
      toast({
        title: "Error",
        description: "Failed to link task to commit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkTaskFromCommit = async (linkId: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(user?.uid && { 'x-user-id': user.uid })
      };

      const response = await fetch(`/api/github/task-links/${linkId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task unlinked from commit successfully!",
        });
        fetchData(); // Refresh the data
      } else {
        throw new Error('Failed to unlink task from commit');
      }
    } catch (error) {
      console.error('Error unlinking task from commit:', error);
      toast({
        title: "Error",
        description: "Failed to unlink task from commit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCommits = commits.filter(commit =>
    commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commit.sha.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTaskById = (taskId: string) => tasks.find(task => task.id === taskId);
  const getCommitBySha = (sha: string) => commits.find(commit => commit.sha === sha);

  return (
    <div className="space-y-6">
      {/* Link Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Create New Task-Commit Link
          </CardTitle>
          <CardDescription>
            Link tasks from your project to specific commits in {repositoryOwner}/{repositoryName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Task</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a task..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{task.status}</Badge>
                        <span>{task.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Commit Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Commit</label>
              <Select value={selectedCommit} onValueChange={setSelectedCommit}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a commit..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCommits.map((commit) => (
                    <SelectItem key={commit.sha} value={commit.sha}>
                      <div className="flex flex-col">
                        <span className="font-medium">{commit.commit.message.substring(0, 50)}...</span>
                        <span className="text-xs text-muted-foreground">{commit.sha.substring(0, 8)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={linkTaskToCommit} 
            disabled={!selectedTask || !selectedCommit || isLinking}
            className="w-full"
          >
            {isLinking ? "Linking..." : "Link Task to Commit"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Links */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Task-Commit Links</CardTitle>
          <CardDescription>
            Current links between tasks and commits in this repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taskCommitLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No task-commit links found for this repository.
            </div>
          ) : (
            <div className="space-y-4">
              {taskCommitLinks.map((link) => {
                const task = getTaskById(link.taskId);
                const commit = getCommitBySha(link.commitSha);
                
                return (
                  <div key={`${link.taskId}-${link.commitSha}`} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Task Info */}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task?.status || 'Unknown'}</Badge>
                          <span className="font-medium">{task?.title || 'Task not found'}</span>
                        </div>
                        
                        {/* Commit Info */}
                        {commit && (
                          <div className="flex items-start gap-3">
                            <GitCommit className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{commit.commit.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {commit.sha.substring(0, 8)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  by {commit.commit.author.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(commit.commit.author.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Linked on {new Date(link.linkedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {commit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(commit.html_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkTaskFromCommit(link.taskId + '-' + link.commitSha)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
