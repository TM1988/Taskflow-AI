"use client";

import { useState, useEffect } from "react";
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
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface TaskDialogDebugProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columns: any[];
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
}

export default function TaskDialogDebug({
  open,
  onOpenChange,
  projectId,
  columns,
  onTaskCreated,
  onTaskUpdated,
}: TaskDialogDebugProps) {
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization, currentWorkspace } = useWorkspace();

  // Debug logging
  useEffect(() => {
    const info = [
      `Dialog open: ${open}`,
      `Project ID: ${projectId}`,
      `Columns: ${columns.length}`,
      `User: ${user?.email || "No user"}`,
      `Workspace: ${currentWorkspace || "No workspace"}`,
      `Organization: ${currentOrganization?.name || "No org"}`,
    ];
    setDebugInfo(info);

    if (open) {
      console.log("🔍 DEBUG: TaskDialog rendered with state:", {
        open,
        projectId,
        columns: columns.length,
        user: user?.email,
        formData,
      });
    }
  }, [
    open,
    projectId,
    columns,
    user,
    currentWorkspace,
    currentOrganization,
    formData,
  ]);

  // Set default column when dialog opens
  useEffect(() => {
    if (open && columns.length > 0 && !formData.columnId) {
      console.log("🔍 DEBUG: Setting default column");
      setFormData((prev) => ({
        ...prev,
        columnId: columns[0].id,
      }));
    }
  }, [open, columns, formData.columnId]);

  const handleSubmit = async () => {
    console.log("🔍 DEBUG: Form submitted with data:", formData);

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    if (!formData.columnId) {
      toast({
        title: "Error",
        description: "Please select a column",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        ...formData,
        projectId: projectId === "personal" ? null : projectId,
        userId: user?.uid,
        organizationId: currentOrganization?.id,
      };

      console.log("🔍 DEBUG: Sending task data:", taskData);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const task = await response.json();
      console.log("🔍 DEBUG: Task created successfully:", task);

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        columnId: columns[0]?.id || "",
        priority: "medium",
        dueDate: null,
        assigneeId: "unassigned",
        tags: [],
      });

      if (onTaskCreated) {
        onTaskCreated(task);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("🔍 DEBUG: Error creating task:", error);
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

  console.log("🔍 DEBUG: TaskDialog render - open:", open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-red-500">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            🔍 DEBUG: Create New Task
          </DialogTitle>
        </DialogHeader>

        {/* Debug Info Panel */}
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-xs">
          <strong>Debug Info:</strong>
          <ul className="mt-1 space-y-1">
            {debugInfo.map((info, index) => (
              <li key={index}>• {info}</li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("🔍 DEBUG: Form onSubmit triggered");
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => {
                console.log("🔍 DEBUG: Title changed to:", e.target.value);
                setFormData({ ...formData, title: e.target.value });
              }}
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
                onValueChange={(value) => {
                  console.log("🔍 DEBUG: Column changed to:", value);
                  setFormData({ ...formData, columnId: value });
                }}
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
              onClick={() => {
                console.log("🔍 DEBUG: Cancel button clicked");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.title.trim() || !formData.columnId
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Creating..." : "🔍 DEBUG: Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
