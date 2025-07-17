"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";
import KanbanColumn from "@/components/board/kanban-column";
import SimpleTaskDialog from "@/components/board/simple-task-dialog";
import ActiveUsers from "@/components/collaboration/active-users";
import CursorOverlay from "@/components/collaboration/cursor-overlay";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeCollaboration } from "@/hooks/use-realtime-collaboration";
import BoardHeader from "@/components/board/board-header";
import { enrichTasksWithAssigneeInfo } from "@/utils/task-enricher";

interface BoardContentProps {
  projectId?: string;
  organizationId?: string;
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
  projectId,
  organizationId,
  onTaskSelect,
  refreshTrigger,
  onProjectUpdate,
}: BoardContentProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Real-time collaboration state
  const [activeCursors, setActiveCursors] = useState<Map<string, any>>(new Map());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    assignees: string[];
    tags: string[];
    priority: string[];
    status: string;
  }>({
    assignees: [],
    tags: [],
    priority: [],
    status: "",
  });

  // Real project members state
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectTags, setProjectTags] = useState<string[]>([]);

  const { user } = useAuth();
  const { currentProject: workspaceProject, currentOrganization } =
    useWorkspace(); // Add currentOrganization
  const { toast } = useToast();

  // Default columns for personal board - memoized to prevent recreation on every render
  const defaultColumns = useMemo(
    () => [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "review", name: "Review", order: 2 },
      { id: "done", name: "Done", order: 3 },
    ],
    [],
  );

  // Real-time collaboration setup
  const {
    getActiveUsers,
    broadcastTaskUpdate,
    broadcastTaskCreate,
    broadcastTaskDelete,
    isConnected: isCollaborationConnected,
  } = useRealtimeCollaboration({
    projectId: workspaceProject?.id || projectId || '',
    organizationId: currentOrganization?.id || organizationId,
    onTaskUpdate: (task) => {
      updateTaskLocally(task);
    },
    onTaskCreate: (task) => {
      setTasks((prevTasks) => [...prevTasks, task]);
    },
    onTaskDelete: (taskId) => {
      removeTaskLocally(taskId);
    },
    onColumnUpdate: (column) => {
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col.id === column.id ? { ...col, ...column } : col
        )
      );
    },
    onCursorMove: (cursor) => {
      setActiveCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(cursor.userId, cursor);
        return newCursors;
      });
      
      // Remove stale cursors after 3 seconds
      setTimeout(() => {
        setActiveCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.delete(cursor.userId);
          return newCursors;
        });
      }, 3000);
    },
  });

  const updateTaskLocally = useCallback(
    (updatedTask: any) => {
      setTasks((prevTasks) => {
        // More robust ID matching - check all possible ID combinations
        const taskId = updatedTask.id || updatedTask._id;
        const taskDbId = updatedTask._id || updatedTask.id;

        const taskFound = prevTasks.find(
          (t) =>
            t.id === taskId ||
            t._id === taskId ||
            t.id === taskDbId ||
            t._id === taskDbId,
        );

        if (!taskFound) {
          return prevTasks; // Return unchanged if task not found
        }

        const newTasks = prevTasks.map((task) => {
          const match =
            task.id === taskId ||
            task._id === taskId ||
            task.id === taskDbId ||
            task._id === taskDbId;

          if (match) {
            // Preserve both ID formats when updating
            return {
              ...task,
              ...updatedTask,
              id: task.id || task._id,
              _id: task._id || task.id,
            };
          }
          return task;
        });

        return newTasks;
      });

      // Remove refresh counter increment - we don't want to trigger unnecessary re-renders
      // The state update above is sufficient to update the UI
      // setRefreshCounter(prev => prev + 1); // REMOVED
    },
    [tasks],
  ); // Add tasks dependency back for proper functionality

  const removeTaskLocally = useCallback((taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== taskId && task._id !== taskId),
    );
    
    // Broadcast task deletion to other users
    if (workspaceProject?.id && workspaceProject.id !== "personal") {
      broadcastTaskDelete(taskId);
    }
    
    // Keep refresh counter for deletion as it might affect layout
    setRefreshCounter((prev) => prev + 1);
  }, [workspaceProject?.id, broadcastTaskDelete]);

  const fetchBoardData = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);

    try {
      // Handle personal board
      if (!projectId && !workspaceProject?.id) {
        // Use workspaceProject here

        const personalColumns = defaultColumns;
        setColumns(personalColumns);

        const tasksResponse = await fetch(
          `/api/tasks?userId=${user.uid}&personal=true&t=${Date.now()}`,
          {
            cache: "no-cache",
          },
        );

        let personalTasks = [];
        if (tasksResponse.ok) {
          personalTasks = await tasksResponse.json();
        }

        const normalizedTasks = personalTasks.map((task: any) => ({
          ...task,
          projectId: "personal", // Explicitly set for personal tasks
          columnId: task.columnId || personalColumns[0]?.id || "todo",
          order: task.order ?? 0,
          id: task.id || task._id, // Ensure id is present
        }));

        setTasks(normalizedTasks);
        setLoading(false);
        return;
      }

      // Handle project board
      if (!workspaceProject?.id) {
        console.log(
          "[BoardContent] No workspace project available for project board. workspaceProject:",
          workspaceProject,
        );
        setLoading(false);
        return;
      }

      console.log(
        `[BoardContent] === FETCHING PROJECT BOARD DATA for project: ${workspaceProject.id}, org: ${currentOrganization?.id} ===`,
      );

      // Construct the API URL for board data, including organizationId if available
      let boardApiUrl = `/api/board/${workspaceProject.id}?userId=${user.uid}&t=${Date.now()}`;
      if (currentOrganization?.id) {
        boardApiUrl += `&organizationId=${currentOrganization.id}`;
        console.log(
          `[BoardContent] Using organizationId: ${currentOrganization.id} in board API call.`,
        );
      }

      // ALSO fetch tasks directly via /api/tasks for comparison and as fallback
      let directTasksApiUrl = `/api/tasks?userId=${user.uid}&t=${Date.now()}`;
      if (currentOrganization?.id && workspaceProject.id) {
        directTasksApiUrl += `&organizationId=${currentOrganization.id}&projectId=${workspaceProject.id}`;
        console.log(
          `[BoardContent] Also fetching tasks directly via /api/tasks with org context`,
        );
      }

      // Fetch both board data and direct tasks in parallel
      const [boardResponse, directTasksResponse] = await Promise.all([
        fetch(boardApiUrl, { cache: "no-cache" }),
        fetch(directTasksApiUrl, { cache: "no-cache" }),
      ]);

      console.log(
        `[BoardContent] Board API response status: ${boardResponse.status}`,
      );
      console.log(
        `[BoardContent] Direct tasks API response status: ${directTasksResponse.status}`,
      );

      let allTasks: any[] = [];
      let fetchedColumns = defaultColumns;

      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        console.log("[BoardContent] Board data received:", boardData);

        // Set columns from board data or use defaults if none are returned
        fetchedColumns =
          boardData.columns && boardData.columns.length > 0
            ? boardData.columns.sort((a: any, b: any) => a.order - b.order)
            : defaultColumns;

        // Process tasks from board data
        allTasks = Object.values(boardData.board || {}).flatMap(
          (column: any) => column.tasks || [],
        );
        console.log(`[BoardContent] Tasks from board API: ${allTasks.length}`);
      }

      // If we have direct tasks response and either no board tasks or as a fallback
      if (directTasksResponse.ok) {
        const directTasks = await directTasksResponse.json();
        console.log(
          `[BoardContent] Tasks from direct API: ${directTasks.length}`,
        );

        if (allTasks.length === 0 && directTasks.length > 0) {
          console.log("[BoardContent] Using direct tasks as primary source");
          allTasks = directTasks;
        } else if (directTasks.length > allTasks.length) {
          console.log(
            "[BoardContent] Direct API returned more tasks, using those",
          );
          allTasks = directTasks;
        }
      }

      // If no columns were returned and it's an org project, try to create defaults
      if (
        currentOrganization?.id &&
        (!fetchedColumns ||
          fetchedColumns.length === 0 ||
          fetchedColumns === defaultColumns)
      ) {
        console.log(
          "[BoardContent] No columns found for org project, attempting to create defaults...",
        );
        try {
          const createColumnsResponse = await fetch("/api/columns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: workspaceProject.id,
              organizationId: currentOrganization.id,
              userId: user.uid,
              createDefaults: true,
            }),
          });

          if (createColumnsResponse.ok) {
            const createResult = await createColumnsResponse.json();
            if (createResult.columns && Array.isArray(createResult.columns)) {
              fetchedColumns = createResult.columns.sort(
                (a: any, b: any) => a.order - b.order,
              );
              console.log(
                "[BoardContent] Successfully created and set default columns:",
                fetchedColumns.length,
              );
            }
          } else {
            console.error(
              "[BoardContent] Failed to create default columns:",
              createColumnsResponse.status,
              await createColumnsResponse.text(),
            );
          }
        } catch (error) {
          console.error(
            "[BoardContent] Error creating default columns:",
            error,
          );
        }
      }

      setColumns(fetchedColumns);

      console.log(`[BoardContent] Setting columns for project:`, {
        projectId: workspaceProject.id,
        columns: fetchedColumns.map((col) => ({
          id: col.id,
          name: col.name,
          order: col.order,
        })),
        columnsCount: fetchedColumns.length,
      });

      // Format and set tasks
      const formattedTasks = allTasks.map((task: any) => {
        return {
          ...task,
          projectId: workspaceProject.id, // Ensure projectId is correctly set from workspace context
          columnId: task.columnId || fetchedColumns[0]?.id || "todo", // Fallback to first column or 'todo'
          order: task.order ?? 0,
          id: task.id || task._id, // Ensure id is present
        };
      });

      console.log(
        `[BoardContent] Final formatted tasks for project ${workspaceProject.id}:`,
        {
          totalTasks: formattedTasks.length,
          taskTitles: formattedTasks.map((t) => t.title),
          tasksByColumn: formattedTasks.reduce(
            (acc, task) => {
              acc[task.columnId] = (acc[task.columnId] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
          taskDetails: formattedTasks.map((t) => ({
            id: t.id,
            title: t.title,
            columnId: t.columnId,
            projectId: t.projectId,
          })),
        },
      );

      // Enrich tasks with assignee information for project tasks
      if (workspaceProject.id !== "personal") {
        try {
          const enrichedTasks = await enrichTasksWithAssigneeInfo(
            formattedTasks,
            workspaceProject.id,
            currentOrganization?.id,
          );
          setTasks(enrichedTasks);
        } catch (error) {
          console.error(
            "[BoardContent] Error enriching tasks with assignee info:",
            error,
          );
          setTasks(formattedTasks);
        }
      } else {
        setTasks(formattedTasks);
      }

      // If we still have no tasks, log additional debug info
      if (formattedTasks.length === 0) {
        console.log(
          "[BoardContent] WARNING: No tasks found after all fetch attempts!",
        );
        console.log(
          "[BoardContent] Debug info - workspaceProject:",
          workspaceProject,
        );
        console.log(
          "[BoardContent] Debug info - currentOrganization:",
          currentOrganization,
        );
        console.log("[BoardContent] Debug info - board API URL:", boardApiUrl);
        console.log(
          "[BoardContent] Debug info - direct tasks API URL:",
          directTasksApiUrl,
        );
      }
    } catch (error) {
      console.error("[BoardContent] Error loading board data:", error);
      toast({
        title: "Error",
        description: "Failed to load board data. Please try refreshing.",
        variant: "destructive",
      });
      // Fallback to default columns and clear tasks on error
      setColumns(defaultColumns);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [
    user?.uid,
    toast,
    defaultColumns,
    workspaceProject,
    projectId,
    currentOrganization,
  ]); // Added workspaceProject, projectId, currentOrganization

  // Fetch real project members and tags for the header dropdown
  const fetchProjectMembersAndTags = useCallback(async () => {
    if (
      !workspaceProject?.id ||
      !user?.uid ||
      workspaceProject.id === "personal"
    ) {
      console.log(
        "🔍 [BoardContent] Clearing members/tags - personal or no project",
      );
      setProjectMembers([]);
      setProjectTags([]);
      return;
    }

    try {
      console.log(
        "🎯 [BoardContent] Fetching members and tags for project:",
        workspaceProject.id,
      );

      // Fetch project members
      const membersResponse = await fetch(
        `/api/projects/${workspaceProject.id}/members?t=${Date.now()}`,
        {
          cache: "no-cache",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (membersResponse.ok) {
        const members = await membersResponse.json();
        console.log(
          "✅ [BoardContent] Fetched project members:",
          members.length,
          "members",
        );
        setProjectMembers(Array.isArray(members) ? members : []);
      } else {
        console.error(
          "❌ [BoardContent] Failed to fetch members:",
          membersResponse.status,
        );
        setProjectMembers([]);
      }

      // Fetch project tags
      const tagsResponse = await fetch(
        `/api/projects/${workspaceProject.id}/tags`,
        {
          cache: "no-cache",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (tagsResponse.ok) {
        const tags = await tagsResponse.json();
        console.log(
          "🏷️ [BoardContent] Fetched project tags:",
          tags.length,
          "tags",
        );
        setProjectTags(Array.isArray(tags) ? tags : []);
      } else {
        console.error(
          "❌ [BoardContent] Failed to fetch tags:",
          tagsResponse.status,
        );
        setProjectTags([]);
      }
    } catch (error) {
      console.error("❌ [BoardContent] Error fetching project data:", error);
      setProjectMembers([]);
      setProjectTags([]);
    }
  }, [workspaceProject?.id, user?.uid]);

  const refreshTasks = useCallback(() => {
    console.log(
      "Refreshing tasks for project:",
      currentProject?.id || "personal",
    );
    fetchBoardData();
  }, []);

  const fetchProjects = useCallback(async () => {
    // Handle specific project by ID
    if (projectId) {
      try {
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setCurrentProject(projectData);
          if (onProjectUpdate) {
            onProjectUpdate(projectData);
          }
        }
      } catch (error) {
        console.error("Error fetching specific project:", error);
      }
    }

    // For personal board (no projectId), we don't need to fetch projects
  }, [projectId, onProjectUpdate]);

  const handleTaskCreated = useCallback(
    async (newTask: any) => {
      // Enrich the new task with assignee information if it's a project task
      if (workspaceProject?.id && workspaceProject.id !== "personal") {
        try {
          const enrichedTask = await enrichTasksWithAssigneeInfo(
            [newTask],
            workspaceProject.id,
            currentOrganization?.id,
          );
          setTasks((prevTasks) => [...prevTasks, enrichedTask[0]]);
          
          // Broadcast task creation to other users
          broadcastTaskCreate(enrichedTask[0]);
        } catch (error) {
          console.error("Error enriching new task with assignee info:", error);
          setTasks((prevTasks) => [...prevTasks, newTask]);
          broadcastTaskCreate(newTask);
        }
      } else {
        setTasks((prevTasks) => [...prevTasks, newTask]);
        // Only broadcast for non-personal boards
        if (workspaceProject?.id && workspaceProject.id !== "personal") {
          broadcastTaskCreate(newTask);
        }
      }
      // Remove refresh counter to prevent visual glitches
      // setRefreshCounter(prev => prev + 1);
    },
    [workspaceProject?.id, currentOrganization?.id, broadcastTaskCreate],
  );

  const handleTaskUpdated = useCallback(
    async (updatedTask: any) => {
      console.log("BoardContent: handleTaskUpdated called with:", updatedTask);

      // Enrich the updated task with assignee information if it's a project task
      if (workspaceProject?.id && workspaceProject.id !== "personal") {
        try {
          const enrichedTask = await enrichTasksWithAssigneeInfo(
            [updatedTask],
            workspaceProject.id,
            currentOrganization?.id,
          );
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === updatedTask.id ? { ...t, ...enrichedTask[0] } : t,
            ),
          );
          
          // Broadcast task update to other users
          broadcastTaskUpdate(enrichedTask[0]);
        } catch (error) {
          console.error(
            "Error enriching updated task with assignee info:",
            error,
          );
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
            ),
          );
          broadcastTaskUpdate(updatedTask);
        }
      } else {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
          ),
        );
        // Only broadcast for non-personal boards
        if (workspaceProject?.id && workspaceProject.id !== "personal") {
          broadcastTaskUpdate(updatedTask);
        }
      }

      // Remove refresh counter to prevent visual glitches
      // setRefreshCounter(prev => prev + 1);
    },
    [workspaceProject?.id, currentOrganization?.id, broadcastTaskUpdate],
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const draggedTaskIndex = tasks.findIndex((t) => t.id === draggableId);
      if (draggedTaskIndex === -1) return;

      const updatedTasks = [...tasks];
      const [movedTask] = updatedTasks.splice(draggedTaskIndex, 1);
      movedTask.columnId = destination.droppableId;
      updatedTasks.splice(destination.index, 0, movedTask);

      setTasks(updatedTasks);
      // Keep refresh counter for drag-and-drop as it affects column layout
      setRefreshCounter((prev) => prev + 1);

      try {
        if (!user?.uid) {
          console.error("User not authenticated for task update");
          return;
        }

        const updateData: any = {
          columnId: movedTask.columnId,
          order: destination.index,
          userId: user.uid,
        };

        // Include organizationId and projectId for organization tasks
        if (currentOrganization?.id && workspaceProject?.id) {
          updateData.organizationId = currentOrganization.id;
          updateData.projectId = workspaceProject.id;
          console.log(
            `[handleDragEnd] Including org context: org=${currentOrganization.id}, project=${workspaceProject.id}`,
          );
        } else if (workspaceProject?.id) {
          updateData.projectId = workspaceProject.id;
          console.log(
            `[handleDragEnd] Including project context: project=${workspaceProject.id}`,
          );
        }

        const response = await fetch(`/api/tasks/${draggableId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            `Failed to move task: ${errorData.error || response.statusText}`,
          );
        }

        const result = await response.json();
        console.log("[handleDragEnd] Task update successful:", result);

        toast({
          title: "Task moved",
          description: `Task moved successfully`,
        });
      } catch (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Error",
          description: "Failed to move task. Refreshing board...",
          variant: "destructive",
        });
        fetchBoardData();
      }
    },
    [
      tasks,
      toast,
      fetchBoardData,
      currentOrganization,
      workspaceProject,
      user?.uid,
    ],
  );

  // Filter tasks based on search query and active filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
          task.assigneeName?.toLowerCase().includes(query) ||
          task.assignee?.name?.toLowerCase().includes(query),
      );
    }

    // Apply assignee filter
    if (activeFilters.assignees.length > 0) {
      filtered = filtered.filter((task) => {
        // Handle "unassigned" filter
        if (activeFilters.assignees.includes("unassigned")) {
          if (!task.assigneeId || task.assigneeId === "unassigned") {
            return true;
          }
        }

        // Handle assigned user filters
        if (task.assigneeId && task.assigneeId !== "unassigned") {
          return (
            activeFilters.assignees.includes(task.assigneeId) ||
            activeFilters.assignees.includes(task.assigneeName)
          );
        }

        return false;
      });
    }

    // Apply tag filter
    if (activeFilters.tags.length > 0) {
      filtered = filtered.filter((task) =>
        task.tags?.some((tag: string) => activeFilters.tags.includes(tag)),
      );
    }

    // Apply priority filter
    if (activeFilters.priority.length > 0) {
      filtered = filtered.filter((task) =>
        activeFilters.priority.includes(task.priority),
      );
    }

    // Apply status filter (based on column)
    if (activeFilters.status) {
      filtered = filtered.filter(
        (task) => task.columnId === activeFilters.status,
      );
    }

    return filtered;
  }, [tasks, searchQuery, activeFilters]);

  const getTasksForColumn = useCallback(
    (columnId: string) => {
      return filteredTasks.filter((task) => task.columnId === columnId);
    },
    [filteredTasks],
  );

  const getColumnColor = useCallback((order: number) => {
    const colors = [
      "bg-slate-100",
      "bg-blue-100",
      "bg-yellow-100",
      "bg-green-100",
    ];
    return colors[order % colors.length];
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilter = useCallback((filters: any) => {
    // Map BoardHeader filter structure to our expected structure
    setActiveFilters({
      assignees: filters.assignee || [],
      tags: filters.tags || [],
      priority: filters.priority || [],
      status: "", // BoardHeader doesn't include status/column filter, could be added later
    });
  }, []);

  const handleColumnUpdate = useCallback((updatedColumns: any[]) => {
    setColumns(updatedColumns);
    setRefreshCounter((prev) => prev + 1);
  }, []);

  // Transform project members to the format expected by BoardHeader
  const headerUsers = useMemo(() => {
    return projectMembers.map((member) => ({
      id: member.id,
      name: member.name,
    }));
  }, [projectMembers]);

  // Effects
  useEffect(() => {
    window.boardContentRef = {
      updateTaskLocally,
      removeTaskLocally,
      refreshTasks,
    };

    return () => {
      delete window.boardContentRef;
    };
  }, [updateTaskLocally, removeTaskLocally, refreshTasks]);

  // Fetch projects only when projectId changes or on mount
  useEffect(() => {
    if (projectId) {
      fetchProjects();
    }
  }, [projectId]);

  // Fetch board data when we have the necessary data and avoid cycles
  useEffect(() => {
    if (user?.uid) {
      // For personal board (no projectId)
      if (!projectId) {
        fetchBoardData();
      }
      // For project board (with projectId and workspace project loaded)
      else if (workspaceProject?.id === projectId) {
        fetchBoardData();
      } else if (projectId && !workspaceProject) {
        console.log(
          "Waiting for workspace project to load for projectId:",
          projectId,
        );
      }
    }
  }, [user?.uid, projectId, workspaceProject?.id, refreshTrigger]);

  // Additional effect to immediately fetch when workspace context changes
  useEffect(() => {
    if (user?.uid && workspaceProject?.id && currentOrganization?.id) {
      console.log(
        "[BoardContent] Workspace context changed, fetching board data immediately",
      );
      fetchBoardData();
    }
  }, [currentOrganization?.id, workspaceProject?.id, user?.uid]);

  // Fetch project members and tags when project changes
  useEffect(() => {
    fetchProjectMembersAndTags();
  }, [fetchProjectMembersAndTags]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="flex items-center justify-between">
        <BoardHeader
          users={headerUsers}
          tags={projectTags}
          onSearch={handleSearch}
          onFilter={handleFilter}
          onAddTask={() => setIsTaskDialogOpen(true)}
          projectId={currentProject?.id}
          onTasksImported={fetchBoardData}
          onColumnUpdate={handleColumnUpdate}
        />
        
        {/* Real-time collaboration indicator */}
        {workspaceProject?.id && workspaceProject.id !== "personal" && (
          <div className="flex items-center gap-4 px-4">
            <ActiveUsers getActiveUsers={getActiveUsers} />
            {isCollaborationConnected && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto min-h-0 relative">
          {/* Cursor overlay for real-time collaboration */}
          {workspaceProject?.id && workspaceProject.id !== "personal" && (
            <CursorOverlay cursors={activeCursors} />
          )}
          
          <div className="flex gap-4 p-4 h-full items-start">
            {columns.map((column) => (
              <div key={column.id} className="flex-1 min-w-[145px]">
                <KanbanColumn
                  id={column.id}
                  title={column.name}
                  tasks={getTasksForColumn(column.id)}
                  onTaskClick={onTaskSelect || (() => {})}
                />
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      <SimpleTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        projectId={workspaceProject?.id || "personal"}
        columns={columns}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
