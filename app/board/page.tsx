"use client";

import { useState, useEffect, Suspense } from "react";
import BoardContent from "@/components/board/board-content";
import TaskDetail from "@/components/board/task-detail";
import DatabaseStatus from "@/components/ui/database-status";
import { useSearchParams } from "next/navigation";
import { taskService } from "@/services/tasks/taskService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/services/auth/AuthContext";

function BoardPageContent() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [boardRefreshTrigger, setBoardRefreshTrigger] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle task selection from URL
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) {
      setSelectedTaskId(taskId);
      setTaskDetailOpen(true);
    }
  }, [searchParams]);

  const handleTaskSelect = (taskId: string) => {
    // Clear previous task if different
    if (selectedTaskId !== taskId) {
      setSelectedTaskId(null);
      // Short delay before setting the new ID to ensure state is reset
      setTimeout(() => {
        setSelectedTaskId(taskId);
        setTaskDetailOpen(true);
      }, 50);
    } else {
      setSelectedTaskId(taskId);
      setTaskDetailOpen(true);
    }
  };

  const handleTaskUpdate = async (updatedTask: any) => {
    try {
      console.log("Personal board: Handling task update:", updatedTask);
      
      // Update via board content component (immediate visual update)
      if (window.boardContentRef?.updateTaskLocally) {
        console.log("Personal board: Updating task locally");
        window.boardContentRef.updateTaskLocally(updatedTask);
      }
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      
      // Force refresh on error
      setBoardRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    // Prevent double-clicks
    if (isDeleting) {
      console.log("[handleTaskDelete] Already deleting, ignoring duplicate request");
      return;
    }

    try {
      setIsDeleting(true);
      console.log("[handleTaskDelete] Starting deletion for task:", taskId);
      
      // Close the dialog immediately for better UX
      setTaskDetailOpen(false);

      // Tell BoardContent component to remove this task locally (optimistic update)
      if (window.boardContentRef && window.boardContentRef.removeTaskLocally) {
        window.boardContentRef.removeTaskLocally(taskId);
        console.log("[handleTaskDelete] Removed task locally from UI");
      }

      // Then perform the actual deletion with projectId for personal tasks
      console.log("[handleTaskDelete] Calling API to delete task with personal projectId");
      
      // Add timeout to prevent hanging
      const deletePromise = taskService.deleteTask(taskId, user?.uid, "personal");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );
      
      const result = await Promise.race([deletePromise, timeoutPromise]);
      console.log("[handleTaskDelete] API deletion result:", result);

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("[handleTaskDelete] Error deleting task:", error);
      
      // Show specific error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to delete task";
      
      toast({
        title: "Error",
        description: `Task deletion failed: ${errorMessage}`,
        variant: "destructive",
      });

      // Refresh the board to ensure sync in case of error (revert optimistic update)
      console.log("[handleTaskDelete] Refreshing board due to error");
      setBoardRefreshTrigger((prev) => prev + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to handle after tasks are imported
  const handleTasksImported = () => {
    // Refresh the board to show new tasks
    setBoardRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <DatabaseStatus />
      <BoardContent
        onTaskSelect={handleTaskSelect}
        refreshTrigger={boardRefreshTrigger}
      />

      <TaskDetail
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        taskId={selectedTaskId}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <BoardPageContent />
    </Suspense>
  );
}
