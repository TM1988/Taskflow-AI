"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  MessageSquare,
  User,
  Calendar as CalendarIcon,
  Edit,
  Trash,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DateSelector } from "@/components/ui/date-selector";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface TaskDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  onTaskUpdate: (task: any) => void;
  onTaskDelete: (taskId: string) => void;
}

// Helper function to safely format dates
function formatDate(
  dateValue: any,
  formatString: string = "MMM dd, yyyy",
): string {
  if (!dateValue) return "Unknown";

  try {
    // Handle Firebase Timestamp objects
    if (dateValue && typeof dateValue.toDate === "function") {
      return format(dateValue.toDate(), formatString);
    }

    // Handle date objects
    if (dateValue instanceof Date) {
      return format(dateValue, formatString);
    }

    // Handle numeric timestamps (milliseconds since epoch)
    if (typeof dateValue === "number") {
      return format(new Date(dateValue), formatString);
    }

    // Handle stringified dates
    if (typeof dateValue === "string") {
      // If it's an ISO string or other valid date string
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, formatString);
      }
    }

    // Handle objects with seconds and nanoseconds (Firestore timestamp format)
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      const milliseconds = dateValue.seconds * 1000;
      return format(new Date(milliseconds), formatString);
    }

    return "Invalid date";
  } catch (error) {
    console.error("Error formatting date:", error, dateValue);
    return "Invalid date";
  }
}

// Helper function to parse date from various formats to Date object
function parseDate(dateValue: any): Date | undefined {
  if (!dateValue) return undefined;

  try {
    // Handle Firebase Timestamp objects
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    }

    // Handle date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Handle numeric timestamps (milliseconds since epoch)
    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }

    // Handle stringified dates
    if (typeof dateValue === "string") {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    // Handle objects with seconds and nanoseconds (Firestore timestamp format)
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      const milliseconds = dateValue.seconds * 1000;
      return new Date(milliseconds);
    }

    return undefined;
  } catch (error) {
    console.error("Error parsing date:", error, dateValue);
    return undefined;
  }
}

export default function TaskDetail({
  open,
  onOpenChange,
  taskId,
  onTaskUpdate,
  onTaskDelete,
}: TaskDetailProps) {
  const [task, setTask] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const resetTaskState = () => {
    setTask(null);
    setComments([]);
    setCommentText("");
    setActiveTab("details");
    setIsEditing(false);
    setEditedTask(null);
  };

  // Initialize editedTask when task changes
  useEffect(() => {
    if (task) {
      setEditedTask({
        ...task,
        dueDate: parseDate(task.dueDate),
      });
    }
  }, [task]);

  // Only fetch task data when dialog is open and taskId exists
  useEffect(() => {
    let isMounted = true;
    console.log(
      `Task detail effect running - taskId: ${taskId}, open: ${open}, currentTaskId: ${task?.id}`,
    );

    // When taskId changes, reset the state
    if (taskId && taskId !== task?.id) {
      resetTaskState();
    }

    const fetchTaskData = async () => {
      if (!taskId || !open) return;

      try {
        // Clear previous task data immediately when fetching a new task
        if (taskId !== task?.id) {
          setTask(null);
        }

        setLoading(true);
        console.log(`Fetching task data for ID: ${taskId}`);

        // Implement parallel fetching of task data and comments
        const [taskResponse, commentsResponse] = await Promise.all([
          fetch(`/api/task-direct/${taskId}`),
          fetch(`/api/tasks/${taskId}/comments`),
        ]);

        // Process task data
        if (taskResponse.ok) {
          const data = await taskResponse.json();
          console.log(`Task data received for ID: ${taskId}`, data);

          // Parse dates if needed
          if (data.dueDate && typeof data.dueDate === "string") {
            try {
              data.dueDate = new Date(data.dueDate);
            } catch (e) {
              // Leave as string if parsing fails
            }
          }

          // Update task state if component still mounted
          if (isMounted) {
            console.log("Setting task data in state");
            setTask(data);
            setIsEditing(false);
          }
        } else {
          console.error(`Error loading task: ${taskResponse.status}`);
        }

        // Process comments data
        if (commentsResponse.ok && isMounted) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (open && taskId) {
      fetchTaskData();
    }

    return () => {
      isMounted = false;
    };
  }, [taskId, open, task?.id]);

  // Add delay before showing error
  useEffect(() => {
    let errorTimeout: NodeJS.Timeout;

    if (open && !loading && !task && taskId) {
      // Add a delay before showing the error to allow for successful loading
      errorTimeout = setTimeout(() => {
        // Only show error if still no task after delay
        if (open && !loading && !task && taskId) {
          console.log("Task still not loaded after delay, showing error");
          toast({
            title: "Error",
            description: "Could not load task details",
            variant: "destructive",
          });
          onOpenChange(false);
        }
      }, 1000); // Give it a full second before deciding it's an error
    }

    return () => {
      clearTimeout(errorTimeout);
    };
  }, [open, loading, task, taskId, toast, onOpenChange]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !taskId || !user) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText,
          taskId,
          authorId: user.uid,
          authorName: user.displayName || user.email,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setCommentText("");

        toast({
          title: "Comment added",
          description: "Your comment has been added successfully",
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editedTask || !taskId) return;

    try {
      const updateData = {
        title: editedTask.title,
        description: editedTask.description,
        priority: editedTask.priority,
        dueDate: editedTask.dueDate ? editedTask.dueDate.toISOString() : null,
      };

      console.log("Updating task with data:", updateData);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Update the task state with the edited values
        setTask({
          ...task,
          ...updateData,
        });

        setIsEditing(false);

        // Notify parent component
        onTaskUpdate({
          ...task,
          ...updateData,
        });

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description:
          "Failed to update task: " +
          (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  };

  console.log("Task detail render state:", {
    taskId,
    hasTask: !!task,
    taskMatches: task?.id === taskId,
    loading,
    open,
  });

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          setIsEditing(false); // Reset edit mode when closing
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">
              Loading task details...
            </p>
          </div>
        ) : task ? (
          <>
            <DialogHeader>
              {!isEditing ? (
                <>
                  <div className="flex justify-between items-start pr-8">
                    <DialogTitle className="text-xl">{task.title}</DialogTitle>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {task.priority} Priority
                    </Badge>

                    {task.dueDate && (
                      <Badge variant="outline">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Due {formatDate(task.dueDate, "MMM d, yyyy")}
                      </Badge>
                    )}

                    {task.tags &&
                      task.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pr-8">
                    <h2 className="text-lg font-semibold">Edit Task</h2>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveEdit}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={editedTask?.title || ""}
                        onChange={(e) =>
                          setEditedTask({
                            ...editedTask,
                            title: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editedTask?.description || ""}
                        onChange={(e) =>
                          setEditedTask({
                            ...editedTask,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <Select
                          value={editedTask?.priority || "medium"}
                          onValueChange={(value) =>
                            setEditedTask({ ...editedTask, priority: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <DateSelector
                        value={editedTask?.dueDate}
                        onChange={(date) =>
                          setEditedTask({ ...editedTask, dueDate: date })
                        }
                        label="Due Date"
                        position="above" // Explicitly position above
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </DialogHeader>

            {!isEditing && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="flex-1">
                    Comments ({comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                      {task.description || "No description provided."}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Assignee</h3>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assigneeName || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Created</h3>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(task.createdAt, "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="space-y-4 mt-4">
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Card key={comment.id} className="p-3">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {comment.authorName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {comment.authorName}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(
                                comment.createdAt,
                                "MMM d, yyyy HH:mm",
                              )}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{comment.content}</p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No comments yet. Be the first to comment!
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="resize-none"
                    />
                    <Button onClick={handleAddComment}>Post</Button>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Activity tracking coming soon!
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Task not found or has been deleted.
          </div>
        )}
      </DialogContent>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (task && task.id) {
            onTaskDelete(task.id);
            onOpenChange(false);
          }
        }}
        variant="destructive"
      />
    </Dialog>
  );
}
