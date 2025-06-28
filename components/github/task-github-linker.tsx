'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitCommit, GitPullRequest, Link as LinkIcon, ExternalLink, Calendar, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  message: string;
  author: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  date: string;
  url: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  html_url: string;
}

interface TaskCommitLink {
  taskId: string;
  commitSha: string;
  linkedAt: string;
}

export default function TaskGitHubLinker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [taskCommitLinks, setTaskCommitLinks] = useState<TaskCommitLink[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedCommit, setSelectedCommit] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tasks, commits, and existing links
      const [tasksRes, commitsRes, linksRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/github/repositories/recent-commits'),
        fetch('/api/github/task-links'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (commitsRes.ok) {
        const commitsData = await commitsRes.json();
        setCommits(commitsData.commits || []);
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setTaskCommitLinks(linksData.links || []);
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
        title: "Missing Selection",
        description: "Please select both a task and a commit to link.",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    try {
      const response = await fetch('/api/github/task-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTask,
          commitSha: selectedCommit,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task linked to commit successfully!",
        });
        
        // Refresh links
        fetchData();
        setSelectedTask('');
        setSelectedCommit('');
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

  const getLinkedCommitsForTask = (taskId: string) => {
    const linkedCommitShas = taskCommitLinks
      .filter(link => link.taskId === taskId)
      .map(link => link.commitSha);
    
    return commits.filter(commit => linkedCommitShas.includes(commit.sha));
  };

  const isCommitLinked = (commitSha: string) => {
    return taskCommitLinks.some(link => link.commitSha === commitSha);
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCommits = commits.filter(commit => 
    commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commit.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Task-GitHub Integration
        </CardTitle>
        <CardDescription>
          Link tasks to GitHub commits and pull requests for better tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Link Creator */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-medium text-sm">Create New Link</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                      <span className="truncate">{task.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCommit} onValueChange={setSelectedCommit}>
              <SelectTrigger>
                <SelectValue placeholder="Select a commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((commit) => (
                  <SelectItem key={commit.sha} value={commit.sha}>
                    <div className="flex items-center gap-2">
                      <GitCommit className="h-3 w-3" />
                      <span className="truncate">{commit.message.slice(0, 50)}...</span>
                      {isCommitLinked(commit.sha) && (
                        <Badge variant="secondary" className="text-xs">Linked</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={linkTaskToCommit} 
            disabled={!selectedTask || !selectedCommit || isLinking}
            className="w-full"
          >
            {isLinking ? 'Linking...' : 'Link Task to Commit'}
          </Button>
        </div>

        {/* Search */}
        <div>
          <Input
            placeholder="Search tasks or commits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Task List with Linked Commits */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Tasks with GitHub Activity</h3>
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks found</p>
          ) : (
            filteredTasks.map((task) => {
              const linkedCommits = getLinkedCommitsForTask(task.id);
              return (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{task.status}</Badge>
                      <h4 className="font-medium text-sm">{task.title}</h4>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                      </div>
                    )}
                  </div>

                  {linkedCommits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Linked Commits:</p>
                      {linkedCommits.map((commit) => (
                        <div key={commit.sha} className="flex items-center gap-3 p-2 bg-accent/50 rounded">
                          <GitCommit className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{commit.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{commit.author.name}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{new Date(commit.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={commit.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {linkedCommits.length === 0 && (
                    <p className="text-xs text-muted-foreground">No linked commits yet</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
