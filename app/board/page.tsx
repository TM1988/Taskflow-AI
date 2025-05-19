"use client";

import { useState, useEffect } from "react";
import BoardContent from "@/components/board/board-content";
import TaskDetail from "@/components/board/task-detail";
import TaskImportExport from "@/components/board/task-import-export";
import { useSearchParams } from "next/navigation";
import { taskService } from "@/services/tasks/taskService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function BoardPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [boardRefreshTrigger, setBoardRefreshTrigger] = useState(0);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<any>(null);

  // Handle task selection
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) {
      setSelectedTaskId(taskId);
      setTaskDetailOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Mark initial load as complete after a short delay
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
      setIsLoading(false);
    }, 2000); // 2 seconds should be enough

    return () => clearTimeout(timer);
  }, []);

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
      await taskService.updateTask(updatedTask.id, updatedTask);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      // Refresh board content without page reload
      setBoardRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setLoadError("Failed to update task. Please try refreshing the page.");
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
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
      await taskService.deleteTask(taskId);

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

  // Get current project from BoardContent component
  const updateCurrentProject = (project: any) => {
    // Only update if the project ID changes to prevent infinite loops
    if (!currentProject || currentProject.id !== project.id) {
      setCurrentProject(project);
    }
  };

  // Show loading state if still initializing
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your tasks...</p>
      </div>
    );
  }

  // Show error state if there was a problem
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive">{loadError}</div>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {currentProject && (
          <TaskImportExport
            projectId={currentProject.id}
            onTasksImported={handleTasksImported}
          />
        )}
      </div>

      <BoardContent
        onTaskSelect={handleTaskSelect}
        refreshTrigger={boardRefreshTrigger}
        onProjectUpdate={updateCurrentProject}
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
