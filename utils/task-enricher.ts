"use client";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  assignee?: {
    name: string;
    avatar: string;
    initials: string;
  };
  [key: string]: any;
}

/**
 * Enriches tasks with assignee information from project members
 */
export async function enrichTasksWithAssigneeInfo(
  tasks: Task[],
  projectId: string,
  organizationId?: string
): Promise<Task[]> {
  console.log("🔧 [TASK ENRICHER] Starting enrichment:", {
    taskCount: tasks.length,
    projectId,
    organizationId,
    taskIds: tasks.map(t => t.id),
    assigneeIds: tasks.map(t => t.assigneeId)
  });

  if (!projectId || projectId === "personal" || tasks.length === 0) {
    console.log("⏭️ [TASK ENRICHER] Skipping enrichment - personal project or no tasks");
    return tasks;
  }

  try {
    // Get project members to map assignee IDs to user info
    const apiUrl = organizationId
      ? `/api/projects/${projectId}/members?organizationId=${organizationId}`
      : `/api/projects/${projectId}/members`;
    
    console.log("🌐 [TASK ENRICHER] Fetching members from:", apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn("⚠️ [TASK ENRICHER] Failed to fetch project members for task enrichment");
      return tasks;
    }

    const members: ProjectMember[] = await response.json();
    console.log("👥 [TASK ENRICHER] Got members:", {
      memberCount: members.length,
      memberNames: members.map(m => m.name),
      memberIds: members.map(m => m.id)
    });
    
    // Create a map for quick lookups
    const memberMap = new Map<string, ProjectMember>();
    members.forEach(member => {
      memberMap.set(member.id, member);
    });

    // Enrich tasks with assignee information
    const enrichedTasks = tasks.map(task => {
      if (!task.assigneeId || task.assigneeId === "unassigned") {
        console.log("⏭️ [TASK ENRICHER] Task has no assignee:", task.id);
        return task;
      }

      const assignee = memberMap.get(task.assigneeId);
      if (!assignee) {
        console.log("❌ [TASK ENRICHER] No member found for assigneeId:", task.assigneeId, "in task:", task.id);
        return task;
      }

      // Generate initials from name
      const initials = assignee.name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const enrichedTask = {
        ...task,
        assigneeName: assignee.name,
        assignee: {
          name: assignee.name,
          avatar: assignee.photoURL || '',
          initials: initials,
        }
      };
      
      console.log("✅ [TASK ENRICHER] Enriched task:", {
        taskId: task.id,
        assigneeId: task.assigneeId,
        assigneeName: assignee.name,
        initials
      });

      return enrichedTask;
    });
    
    console.log("🏁 [TASK ENRICHER] Enrichment complete:", {
      originalCount: tasks.length,
      enrichedCount: enrichedTasks.length,
      enrichedTasksWithAssignees: enrichedTasks.filter(t => t.assignee).length
    });

    return enrichedTasks;
  } catch (error) {
    console.error("💥 [TASK ENRICHER] Error enriching tasks with assignee info:", error);
    return tasks;
  }
}

/**
 * Enriches a single task with assignee information
 */
export async function enrichTaskWithAssigneeInfo(
  task: Task,
  projectId: string,
  organizationId?: string
): Promise<Task> {
  console.log("🔧 [TASK ENRICHER] Starting single task enrichment:", {
    taskId: task.id,
    taskTitle: task.title,
    assigneeId: task.assigneeId,
    projectId,
    organizationId
  });
  
  const enrichedTasks = await enrichTasksWithAssigneeInfo([task], projectId, organizationId);
  const enrichedTask = enrichedTasks[0] || task;
  
  console.log("✅ [TASK ENRICHER] Enrichment complete:", {
    taskId: enrichedTask.id,
    hasAssignee: !!enrichedTask.assignee,
    assigneeName: enrichedTask.assignee?.name,
    assigneeId: enrichedTask.assigneeId
  });
  
  return enrichedTask;
}
