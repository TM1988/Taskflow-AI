"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";
import KanbanColumn from "@/components/board/kanban-column";
import TaskDialog from "@/components/board/task-dialog";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BoardHeader from "@/components/board/board-header";
import { Badge } from "@/components/ui/badge";

interface BoardContentProps {
  onTaskSelect?: (taskId: string) => void;
  refreshTrigger?: number;
  onProjectUpdate?: (project: any) => void;
}

declare global {
  interface Window {
    boardContentRef:
      | {
          removeTaskLocally: (taskId: string) => void;
          updateTaskLocally: (updatedTask: any) => void;
          refreshTasks: () => void;
        }
      | undefined;
  }
}

export default function BoardContent({
  onTaskSelect,
  refreshTrigger = 0,
  onProjectUpdate,
}: BoardContentProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock users and tags for the header
  const mockUsers = [
    { id: "1", name: "Alice Chen" },
    { id: "2", name: "Bob Smith" },
    { id: "3", name: "Charlie Kim" },
  ];

  const mockTags = ["frontend", "backend", "bug", "feature", "urgent"];

  // Default columns
  const defaultColumns = [
    { id: "todo", title: "To Do", name: "To Do", color: "bg-slate-100" },
    { id: "in-progress", title: "In Progress", name: "In Progress", color: "bg-blue-100" },
    { id: "review", title: "Review", name: "Review", color: "bg-yellow-100" },
    { id: "done", title: "Done", name: "Done", color: "bg-green-100" },
  ];

  // Helper function to get tasks for a column
  const getTasksForColumn = (columnId: string) => {
    return filteredTasks.filter((task) => task.columnId === columnId);
  };

  // Fetch projects once with better error handling
  const fetchProjects = useCallback(async () => {
    if (!user || currentProject) return;

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Fetching projects (attempt ${retryCount + 1})`);
        
        const projectsResponse = await fetch(`/api/projects?userId=${user.uid}`);

        if (!projectsResponse.ok) {
          throw new Error(`HTTP ${projectsResponse.status}: ${projectsResponse.statusText}`);
        }

        const projects = await projectsResponse.json();
        console.log("Projects fetched successfully:", projects.length);

        if (projects.length === 0) {
          // Create default project
          const defaultName = 
            typeof window !== "undefined" && localStorage.getItem("defaultProjectName")
              ? localStorage.getItem("defaultProjectName")!
              : "My First Project";

          const newProjectResponse = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: defaultName,
              description: "TaskFlow AI default project",
              ownerId: user.uid,
            }),
          });

          if (!newProjectResponse.ok) {
            throw new Error("Failed to create default project");
          }

          const newProject = await newProjectResponse.json();
          setCurrentProject(newProject);

          if (onProjectUpdate) {
            onProjectUpdate(newProject);
          }
        } else {
          setCurrentProject(projects[0]);

          if (onProjectUpdate) {
            onProjectUpdate(projects[0]);
          }
        }

        // Success - break out of retry loop
        break;

      } catch (error) {
        retryCount++;
        console.error(`Error fetching projects (attempt ${retryCount}):`, error);
        
        if (retryCount === maxRetries) {
          toast({
            title: "Connection Error",
            description: "Failed to load projects after multiple attempts. Please refresh the page.",
            variant: "destructive",
          });
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
  }, [user, toast, onProjectUpdate, currentProject]);

  // Fetch board data and columns
  const fetchBoardData = useCallback(async () => {
    if (!currentProject?.id) return;

    setLoading(true);

    try {
      console.log("=== FETCHING BOARD DATA ===");
      console.log("Project ID:", currentProject.id);
      
      const boardResponse = await fetch(`/api/board/${currentProject.id}`);

      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        console.log("Raw board data:", boardData);

        const allTasks = Object.values(boardData.board || {}).flatMap(
          (column: any) => column.tasks || [],
        ).map((task: any) => ({
          ...task,
          projectId: typeof task.projectId === 'object' ? task.projectId.toString() : task.projectId,
          order: task.order ?? 0,
          id: task.id || task._id,
        }));

        console.log("BoardContent: All tasks fetched and normalized:", allTasks);
        console.log("Task count:", allTasks.length);
        console.log("Sample task:", allTasks[0]);
        
        setTasks(allTasks);
        setFilteredTasks(allTasks);
      } else {
        console.error("Board response not ok:", boardResponse.status);
      }

      // Always fetch columns to get latest updates
      console.log("=== FETCHING COLUMNS ===");
      const columnsResponse = await fetch(`/api/columns?projectId=${currentProject.id}`);
      console.log("Columns response status:", columnsResponse.status);

      if (columnsResponse.ok) {
        const columnsData = await columnsResponse.json();
        console.log("Columns data:", columnsData);
        
        if (columnsData.length > 0) {
          setColumns(columnsData.sort((a: any, b: any) => a.order - b.order));
        } else {
          console.log("No columns found, using defaults");
          setColumns(defaultColumns);
        }
      } else {
        console.warn("Failed to fetch columns, using defaults");
        setColumns(defaultColumns);
      }
    } catch (error) {
      console.error("Error loading board data:", error);
      toast({
        title: "Error",
        description: "Failed to load board data",
        variant: "destructive",
      });

      if (columns.length === 0) {
        setColumns(defaultColumns);
      }
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, toast]);

  // Expose methods to window for access
  useEffect(() => {
    window.boardContentRef = {
      removeTaskLocally: (taskId: string) => {
        console.log("BoardContent: removeTaskLocally called with:", taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setFilteredTasks((prev) => prev.filter((t) => t.id !== taskId));
      },
      updateTaskLocally: (updatedTask: any) => {
        console.log("BoardContent: updateTaskLocally called with:", updatedTask);
        
        const normalizedTask = {
          ...updatedTask,
          projectId: typeof updatedTask.projectId === 'object' ? updatedTask.projectId.toString() : updatedTask.projectId,
          order: updatedTask.order ?? 0,
          id: updatedTask.id || updatedTask._id,
        };
        
        setTasks((prev) => prev.map(t => t.id === normalizedTask.id ? normalizedTask : t));
        setFilteredTasks((prev) => prev.map(t => t.id === normalizedTask.id ? normalizedTask : t));
      },
      refreshTasks: () => {
        console.log("BoardContent: refreshTasks called - forcing full refresh");
        setTasks([]);
        setFilteredTasks([]);
        fetchBoardData();
      }
    };

    return () => {
      delete window.boardContentRef;
    };
  }, [fetchBoardData]);

  // Initial project fetch
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
    setTasks((prev) => [...prev, newTask]);
    setFilteredTasks((prev) => [...prev, newTask]);
  };

  // Handle task updates
  const handleTaskUpdated = (updatedTask: any) => {
    console.log("BoardContent: handleTaskUpdated called with:", updatedTask);
    
    const normalizedTask = {
      ...updatedTask,
      projectId: typeof updatedTask.projectId === 'object' ? updatedTask.projectId.toString() : updatedTask.projectId,
      order: updatedTask.order ?? 0,
      id: updatedTask.id || updatedTask._id,
    };
    
    setTasks((prev) => prev.map(t => t.id === normalizedTask.id ? normalizedTask : t));
    setFilteredTasks((prev) => prev.map(t => t.id === normalizedTask.id ? normalizedTask : t));
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const draggedTaskIndex = tasks.findIndex((t) => t.id === draggableId);
    if (draggedTaskIndex === -1) return;
    const updatedTasks = [...tasks];
    const [movedTask] = updatedTasks.splice(draggedTaskIndex, 1);
    movedTask.columnId = destination.droppableId;
    updatedTasks.splice(destination.index, 0, movedTask);

    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);

    try {
      const response = await fetch(`/api/tasks/${movedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: movedTask.columnId,
          order: destination.index,
        }),
      });

      if (!response.ok) throw new Error("Failed to move task");
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      fetchBoardData();
    }
  };

  // Search and filter handlers
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredTasks(tasks);
      return;
    }

    const filtered = tasks.filter((task) => {
      const q = query.toLowerCase();
      return (
        task.title?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        (task.assignee && task.assignee.toLowerCase().includes(q))
      );
    });

    setFilteredTasks(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...tasks];

    if (filters.priority.length > 0) {
      filtered = filtered.filter((task) => filters.priority.includes(task.priority));
    }

    if (filters.assignee.length > 0) {
      filtered = filtered.filter((task) => filters.assignee.includes(task.assignee));
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((task) =>
        task.tags?.some((tag: string) => filters.tags.includes(tag))
      );
    }

    setFilteredTasks(filtered);
  };

  if (loading && !currentProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Helper function to assign colors based on order
  const getColumnColor = (order: number) => {
    const colors = ["bg-slate-100", "bg-blue-100", "bg-yellow-100", "bg-green-100", "bg-purple-100", "bg-pink-100", "bg-indigo-100", "bg-orange-100"];
    return colors[order % colors.length];
  };

  // Use dynamic columns or fallback to defaults
  const displayColumns = columns.length > 0 ? columns.map(col => ({
    id: col.id,
    title: col.name || col.title,
    color: getColumnColor(col.order || 0)
  })) : defaultColumns;

  return (
    <div className="h-full flex flex-col min-w-0">
      <BoardHeader
        users={mockUsers}
        tags={mockTags}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onAddTask={() => setIsTaskDialogOpen(true)}
        projectId={currentProject?.id}
        onTasksImported={fetchBoardData}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto min-h-0">
          <div className="flex gap-4 p-4 h-full items-start">
            {displayColumns.map((column) => (
              <div
                key={column.id}
                className="flex-1 min-w-[145px]"
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  tasks={getTasksForColumn(column.id)}
                  onTaskClick={onTaskSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        columns={displayColumns}
        projectId={currentProject?.id}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}
