"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AssigneeDropdownExtreme } from "@/components/ui/assignee-dropdown-extreme";

interface SimpleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columns: any[];
  onTaskCreated?: (task: any) => void;
}

export default function SimpleTaskDialog({
  open,
  onOpenChange,
  projectId,
  columns,
  onTaskCreated,
}: SimpleTaskDialogProps) {
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
  const [newTag, setNewTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization, currentWorkspace } = useWorkspace();

  // Check if this is a project task (not personal)
  const isProjectTask =
    projectId &&
    projectId !== "personal" &&
    projectId !== null &&
    projectId !== undefined;

  // Reset form and set default column when dialog opens
  useEffect(() => {
    if (open && columns.length > 0) {
      setFormData({
        title: "",
        description: "",
        columnId: columns[0].id,
        priority: "medium",
        dueDate: null,
        assigneeId: "unassigned",
        tags: [],
      });
      setNewTag("");
    }
  }, [open, columns]);

  // Fetch available tags when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableTags();
    }
  }, [open, projectId]);

  const fetchAvailableTags = async () => {
    console.log(
      "🎯 SimpleTaskDialog: Fetching available tags for project:",
      projectId,
    );
    setIsLoadingTags(true);
    try {
      // Use same personal task detection logic
      const isPersonalForTags =
        !projectId ||
        projectId === "personal" ||
        projectId === null ||
        projectId === undefined;

      if (!isPersonalForTags) {
        // Fetch project tags
        console.log("🔍 SimpleTaskDialog: Fetching project tags");
        const response = await fetch(`/api/projects/${projectId}/tags`);
        if (response.ok) {
          const tags = await response.json();
          console.log("✅ SimpleTaskDialog: Fetched project tags:", tags);
          setAvailableTags(Array.isArray(tags) ? tags : []);
        } else {
          console.warn("⚠️ SimpleTaskDialog: Failed to fetch project tags");
          setAvailableTags([]);
        }
      } else {
        // Fetch personal tags
        if (user?.uid) {
          console.log(
            "🏠 SimpleTaskDialog: Fetching personal tags for user:",
            user.uid,
          );
          const response = await fetch(`/api/user-tags/${user.uid}`);
          if (response.ok) {
            const tags = await response.json();
            console.log("✅ SimpleTaskDialog: Fetched personal tags:", tags);
            setAvailableTags(Array.isArray(tags) ? tags : []);
          } else {
            console.warn("⚠️ SimpleTaskDialog: Failed to fetch personal tags");
            setAvailableTags([]);
          }
        }
      }
    } catch (error) {
      console.error("❌ SimpleTaskDialog: Error fetching tags:", error);
      setAvailableTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        console.log("🔍 SimpleTaskDialog: ESC key pressed, closing dialog");
        onOpenChange(false);
      }
    };

    if (open) {
      console.log("🎯 SimpleTaskDialog: Dialog opened, adding event listeners");
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [open, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 SimpleTaskDialog: Form submitted with data:", formData);

    if (!formData.title.trim()) {
      console.warn("⚠️ SimpleTaskDialog: Validation failed - no title");
      toast({
        title: "Validation Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    if (!formData.columnId) {
      console.warn(
        "⚠️ SimpleTaskDialog: Validation failed - no column selected",
      );
      toast({
        title: "Validation Error",
        description: "Please select a column",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine if this is a personal task
      const isPersonalTask =
        !projectId ||
        projectId === "personal" ||
        projectId === null ||
        projectId === undefined;

      const taskData = {
        ...formData,
        projectId: isPersonalTask ? "personal" : projectId,
        userId: user?.uid,
        organizationId: isPersonalTask ? null : currentOrganization?.id,
      };

      console.log("📤 SimpleTaskDialog: Sending task data to API:", taskData);
      console.log("🔍 SimpleTaskDialog: Personal task check:", {
        originalProjectId: projectId,
        isPersonalTask,
        finalProjectId: taskData.projectId,
        hasOrgId: !!currentOrganization?.id,
        userId: user?.uid,
      });

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to create task";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        console.error("❌ SimpleTaskDialog: API error:", errorMessage);
        throw new Error(errorMessage);
      }

      const task = await response.json();
      console.log("✅ SimpleTaskDialog: Task created successfully:", task);

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      // Call success callback
      if (onTaskCreated) {
        onTaskCreated(task);
      }

      // Close dialog (form will reset when reopened)
      onOpenChange(false);
    } catch (error) {
      console.error("❌ SimpleTaskDialog: Error creating task:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      console.log("🏷️ SimpleTaskDialog: Adding new tag:", newTag.trim());
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      console.log("🔄 SimpleTaskDialog: Dialog closed, resetting form");
      setFormData({
        title: "",
        description: "",
        columnId: "",
        priority: "medium",
        dueDate: null,
        assigneeId: "unassigned",
        tags: [],
      });
      setNewTag("");
      setAvailableTags([]);
      setIsLoadingTags(false);
    }
  }, [open]);

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const addExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  if (!open) return null;

  // Determine if this is a personal task for rendering
  const isPersonalTask =
    !projectId ||
    projectId === "personal" ||
    projectId === null ||
    projectId === undefined;

  console.log("🔍 SimpleTaskDialog: Rendering dialog with state:", {
    open,
    projectId,
    isProjectTask,
    isPersonalTask,
    columnsCount: columns.length,
    availableTagsCount: availableTags.length,
    formData,
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border relative"
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Create New Task
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
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

            {/* Description */}
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

            {/* Column and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Column</label>
                <select
                  value={formData.columnId}
                  onChange={(e) =>
                    setFormData({ ...formData, columnId: e.target.value })
                  }
                  className="dialog-select flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select column</option>
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title || column.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="dialog-select flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Assignee selection for project tasks */}
            {!isPersonalTask && (
              <div className="space-y-1">
                <label className="block text-sm font-medium">Assignee</label>
                <AssigneeDropdownExtreme
                  projectId={projectId}
                  selectedAssigneeId={formData.assigneeId}
                  onAssigneeSelect={(assigneeId) =>
                    setFormData({ ...formData, assigneeId })
                  }
                  className="w-full"
                  organizationId={currentOrganization?.id}
                />
              </div>
            )}

            {/* Due Date */}
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

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Tags</label>

              {/* Current tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
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
                  placeholder="Add tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
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
            </div>

            {/* Available tags */}
            {isLoadingTags ? (
              <div className="text-xs text-muted-foreground">
                Loading available tags...
              </div>
            ) : availableTags.length > 0 ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTags
                    .filter((tag) => !formData.tags.includes(tag))
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
            ) : null}

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !formData.title.trim() || !formData.columnId
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-current" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
