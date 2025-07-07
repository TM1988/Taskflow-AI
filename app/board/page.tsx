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
    try {
      // Close the dialog immediately for better UX
      setTaskDetailOpen(false);

      // Tell BoardContent component to remove this task locally
      if (window.boardContentRef && window.boardContentRef.removeTaskLocally) {
        window.boardContentRef.removeTaskLocally(taskId);
      }

      // Then perform the actual deletion
      await taskService.deleteTask(taskId, user?.uid);

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });

      // Refresh the board to ensure sync in case of error
      setBoardRefreshTrigger((prev) => prev + 1);
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
