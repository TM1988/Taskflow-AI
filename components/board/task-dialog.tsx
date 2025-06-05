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

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  columns: { id: string; title?: string; name?: string }[];
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { toast } = useToast();

  // Reset when dialog opens - ONLY reset when dialog first opens, not on every columns change
  useEffect(() => {
    if (open && columns.length > 0) {
      setFormData({
        title: "",
        description: "",
        columnId: columns[0]?.id || "",
        priority: "medium",
        dueDate: null,
      });
    }
  }, [open]); // REMOVED columns dependency to prevent constant resets

  // Handle column changes separately - only update columnId if current one doesn't exist
  useEffect(() => {
    if (columns && columns.length > 0 && formData.columnId) {
      const currentColumnExists = columns.find(
        (col) => col.id === formData.columnId
      );

      // Only update if current column doesn't exist in new columns
      if (!currentColumnExists) {
        setFormData((prev) => ({
          ...prev,
          columnId: columns[0]?.id || "",
        }));
      }
    }
  }, [columns, formData.columnId]);

  const handleSubmit = async () => {
    const { title, description, columnId, priority, dueDate } = formData;
    console.log("Submitting task:", {
      title,
      description,
      columnId,
      priority,
      dueDate,
    });
    if (!title.trim() || !columnId || !projectId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Format the request payload
      const taskData = {
        title,
        description,
        columnId,
        priority,
        dueDate,
      };

      console.log("Creating task:", taskData);

      // Try the board-specific API endpoint
      const response = await fetch(`/api/board/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await response.json();
      console.log("Task created:", newTask);

      // Clear form
      setFormData({
        title: "",
        description: "",
        columnId: columns[0]?.id || "",
        priority: "medium",
        dueDate: null,
      });

      // Use the callback to update the board
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      onOpenChange(false);

      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Describe the task..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Column</label>
              <Select
                value={formData.columnId}
                onValueChange={(value) =>
                  setFormData({ ...formData, columnId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
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

            <div className="space-y-2">
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
