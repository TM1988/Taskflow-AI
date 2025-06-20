"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import BoardContent from "@/components/board/board-content";
import TaskDetail from "@/components/board/task-detail";
import DatabaseStatus from "@/components/ui/database-status";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/services/auth/AuthContext";

export default function ProjectBoardPage() {
  const params = useParams();
  const { user } = useAuth();
  const { currentOrganization, currentProject } = useWorkspace();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleTaskUpdate = (updatedTask: any) => {
    console.log("Project board: Handling task update:", updatedTask);
    
    // Update via board content component first (immediate visual update)
    if (window.boardContentRef?.updateTaskLocally) {
      console.log("Project board: Updating task locally");
      window.boardContentRef.updateTaskLocally(updatedTask);
    }
    
    // Trigger a refresh of the board to ensure sync with server
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      console.log("Project board: Deleting task:", taskId);
      
      // Call the DELETE API with proper context
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          ...(currentOrganization?.id && { organizationId: currentOrganization.id }),
          ...(currentProject?.id && { projectId: currentProject.id }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task");
      }

      console.log("Project board: Task deleted successfully");
      
      // Remove task locally for immediate UI update
      if (window.boardContentRef?.removeTaskLocally) {
        window.boardContentRef.removeTaskLocally(taskId);
      }
      
      // Trigger a refresh of the board
      setRefreshTrigger(prev => prev + 1);
      setSelectedTaskId(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      // Could add toast notification here if needed
    }
  };

  return (
    <div className="h-full">
      <DatabaseStatus />
      <BoardContent
        projectId={params.projectId as string}
        onTaskSelect={handleTaskSelect}
        refreshTrigger={refreshTrigger}
      />
      
      <TaskDetail
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        taskId={selectedTaskId}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  );
}
