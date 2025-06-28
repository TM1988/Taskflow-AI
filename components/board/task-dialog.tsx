"use client";

import { useState, useEffect } from "react";
import { DateSelector } from "@/components/ui/date-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // Added import

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  columns: { id: string; title?: string; name?: string }[];
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

export default function TaskDialog({
  open,
  onOpenChange,
  projectId,
  columns,
  onTaskCreated,
  onTaskUpdated,
}: TaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    columnId: "",
    priority: "medium",
    dueDate: null as string | null,
    assigneeId: "unassigned",
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization, currentWorkspace } = useWorkspace();

  // Fetch project members when dialog opens for project tasks
  useEffect(() => {
    if (open && projectId && projectId !== "personal") {
      fetchProjectMembers();
      fetchProjectTags();
    } else if (open && projectId === "personal") {
      fetchPersonalTags();
    }
  }, [open, projectId]);

  const fetchProjectMembers = async () => {
    try {
      console.log('Fetching project members for projectId:', projectId);
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const members = await response.json();
        console.log('Fetched project members:', members);
        setProjectMembers(members);
      } else {
        console.error('Failed to fetch project members:', response.status, response.statusText);
        setProjectMembers([]);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
      setProjectMembers([]);
    }
  };

  const fetchProjectTags = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tags`);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('Error fetching project tags:', error);
      setAvailableTags(['frontend', 'backend', 'bug', 'feature', 'urgent']); // fallback
    }
  };

  const fetchPersonalTags = async () => {
    try {
      const response = await fetch(`/api/user-tags/${user?.uid}`);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('Error fetching personal tags:', error);
      setAvailableTags(['personal', 'work', 'urgent', 'low-priority']); // fallback
    }
  };

  // Reset when dialog opens
  useEffect(() => {
    if (open && columns.length > 0) {
      setFormData({
        title: "",
        description: "",
        columnId: columns[0]?.id || "",
        priority: "medium",
        dueDate: null,
        assigneeId: "unassigned",
        tags: [],
      });
    }
  }, [open, columns]);

  // Handle column changes separately
  useEffect(() => {
    if (columns && columns.length > 0 && formData.columnId) {
      const currentColumnExists = columns.find(
        (col) => col.id === formData.columnId
      );

      if (!currentColumnExists) {
        setFormData((prev) => ({
          ...prev,
          columnId: columns[0]?.id || "",
        }));
      }
    }
  }, [columns, formData.columnId]);

  const handleSubmit = async () => {
    const { title, description, columnId, priority, dueDate, assigneeId, tags } = formData;
    
    if (!title.trim() || !columnId) {
      toast({
        title: "Error",
        description: "Please fill in title and select a column.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (!user?.uid) {
        toast({
          title: "Error",
          description: "You must be logged in to create tasks",
          variant: "destructive",
        });
        return;
      }

      // Format the request payload
      const taskData: any = {
        title,
        description,
        columnId,
        priority,
        dueDate,
        userId: user.uid,
        tags,
      };

      // Add assignee for project tasks
      if (projectId !== "personal" && assigneeId && assigneeId !== "unassigned") {
        taskData.assigneeId = assigneeId;
      }

      let apiUrl = "/api/tasks";

      // Handle different task types
      if (projectId === "personal") {
        taskData.projectId = "personal";
      } else if (currentWorkspace === 'organization' && currentOrganization?.id && projectId) {
        taskData.organizationId = currentOrganization.id;
        taskData.projectId = projectId;
      } else if (projectId) {
        taskData.projectId = projectId;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const newTask = await response.json();
      
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter task title"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter task description (optional)"
              className="w-full min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Column</label>
              <Select
                value={formData.columnId}
                onValueChange={(value) =>
                  setFormData({ ...formData, columnId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title || column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee selection for project tasks */}
          {projectId && projectId !== "personal" && (
            <div className="space-y-1">
              <label className="block text-sm font-medium">Assignee</label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigneeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tags</label>
            
            {/* Current tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add new tag */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                className="text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Available tags */}
            {availableTags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTags
                    .filter(tag => !formData.tags.includes(tag))
                    .slice(0, 8)
                    .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => addExistingTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={formData.dueDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.columnId}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
