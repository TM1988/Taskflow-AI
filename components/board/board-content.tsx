"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import KanbanColumn from "@/components/board/kanban-column";
import TaskDialog from "@/components/board/task-dialog";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BoardContentProps {
  onTaskSelect?: (taskId: string) => void;
  refreshTrigger?: number;
  onProjectUpdate?: (project: any) => void; // New prop to update parent with project info
}

declare global {
  interface Window {
    boardContentRef:
      | {
          removeTaskLocally: (taskId: string) => void;
        }
      | undefined;
  }
}

export default function BoardContent({
  onTaskSelect,
  refreshTrigger = 0,
  onProjectUpdate,
}: BoardContentProps) {
  const [boardData, setBoardData] = useState<Record<string, any>>({});
  const [columns, setColumns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Expose the removeTaskLocally method to window for access
  useEffect(() => {
    window.boardContentRef = {
      removeTaskLocally: (taskId: string) => {
        setBoardData((prevData) => {
          const newData = { ...prevData };

          // Go through each column and remove the task
          Object.keys(newData).forEach((columnId) => {
            if (newData[columnId]?.tasks) {
              newData[columnId].tasks = newData[columnId].tasks.filter(
                (task: any) => task.id !== taskId,
              );
            }
          });

          return newData;
        });

        // Also update tasks array
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      },
    };

    return () => {
      delete window.boardContentRef;
    };
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    try {
      const projectsResponse = await fetch(`/api/projects?userId=${user.uid}`);

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projects = await projectsResponse.json();

      if (projects.length === 0) {
        // Create a default project
        console.log("No projects found, creating default project");
        const newProjectResponse = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "My First Project",
            description: "TaskFlow AI default project",
            ownerId: user.uid,
          }),
        });

        if (!newProjectResponse.ok) {
          throw new Error("Failed to create default project");
        }

        const newProject = await newProjectResponse.json();
        setCurrentProject(newProject);

        // Notify parent component about project
        if (onProjectUpdate) {
          onProjectUpdate(newProject);
        }
      } else {
        // Use first project
        setCurrentProject(projects[0]);

        // Notify parent component about project
        if (onProjectUpdate) {
          onProjectUpdate(projects[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [user, toast, onProjectUpdate]);

  // Fetch board data
  const fetchBoardData = useCallback(async () => {
    if (!currentProject?.id) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/board/${currentProject.id}`);

      if (!response.ok) {
        throw new Error("Failed to load board data");
      }

      const data = await response.json();

      // Set columns and board data
      setColumns(data.columns || []);
      setBoardData(data.board || {});

      // Collect all tasks
      const allTasks = Object.values(data.board || {}).flatMap(
        (column: any) => column.tasks || [],
      );

      setTasks(allTasks);
    } catch (error) {
      console.error("Error loading board data:", error);
      toast({
        title: "Error",
        description: "Failed to load board data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, toast]);

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load board data when project changes or refresh trigger changes
  useEffect(() => {
    if (currentProject?.id) {
      fetchBoardData();
    }
  }, [currentProject, fetchBoardData, refreshTrigger]);

  // Handle new task creation
  const handleTaskCreated = (newTask: any) => {
    // Make a copy of the board data
    const updatedBoardData = { ...boardData };

    // Make sure the column exists in boardData
    if (!updatedBoardData[newTask.columnId]) {
      updatedBoardData[newTask.columnId] = {
        id: newTask.columnId,
        title:
          columns.find((c) => c.id === newTask.columnId)?.name || "Unknown",
        tasks: [],
      };
    }

    // Make sure tasks array exists
    if (!updatedBoardData[newTask.columnId].tasks) {
      updatedBoardData[newTask.columnId].tasks = [];
    }

    // Add the new task to the appropriate column
    updatedBoardData[newTask.columnId].tasks = [
      ...updatedBoardData[newTask.columnId].tasks,
      newTask,
    ];

    // Update the state
    setBoardData(updatedBoardData);
    setTasks([...tasks, newTask]);
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task being dragged
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    try {
      // Make an optimistic update to the UI first
      const updatedBoardData = { ...boardData };

      // Remove from source
      updatedBoardData[source.droppableId].tasks = updatedBoardData[
        source.droppableId
      ].tasks.filter((t: any) => t.id !== draggableId);

      // Add to destination
      const updatedTask = { ...task, columnId: destination.droppableId };

      // If destination array doesn't exist, create it
      if (!updatedBoardData[destination.droppableId].tasks) {
        updatedBoardData[destination.droppableId].tasks = [];
      }

      // Insert at the right position
      updatedBoardData[destination.droppableId].tasks.splice(
        destination.index,
        0,
        updatedTask,
      );

      // Update the state immediately for better UX
      setBoardData(updatedBoardData);

      // Then make the API call
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: destination.droppableId,
          order: destination.index,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      // Update the tasks array
      const updatedTasks = tasks.map((t) =>
        t.id === draggableId ? { ...t, columnId: destination.droppableId } : t,
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });

      // Revert to previous state
      fetchBoardData();
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-muted-foreground">
            {currentProject ? currentProject.name : "Loading project..."}
          </p>
        </div>
        <Button onClick={() => setIsTaskDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.name}
              tasks={boardData[column.id]?.tasks || []}
              onTaskClick={(taskId) => {
                if (onTaskSelect) {
                  onTaskSelect(taskId);
                }
              }}
            />
          ))}
        </div>
      </DragDropContext>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        projectId={currentProject?.id}
        columns={columns}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
