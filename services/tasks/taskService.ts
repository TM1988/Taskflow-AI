import {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocument,
} from "@/services/db/firestore";

// Collection name constants
const TASKS_COLLECTION = "tasks";

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  projectId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date;
  tags?: string[];
  sprintId?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  columnId?: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string | null;
  order?: number;
  sprintId?: string | null;
}

export const taskService = {
  // Get all tasks for a project
  async getProjectTasks(projectId: string) {
    return await getDocuments(
      TASKS_COLLECTION,
      [["projectId", "==", projectId]],
      "order",
    );
  },

  // Get tasks for a specific column
  async getColumnTasks(columnId: string) {
    return await getDocuments(
      TASKS_COLLECTION,
      [["columnId", "==", columnId]],
      "order",
    );
  },

  // Get a task by ID
  async getTask(taskId: string) {
    return await getDocument(TASKS_COLLECTION, taskId);
  },

  // Create a new task
  async createTask(data: CreateTaskDTO) {
    // Get the max order value for the column to place this task at the end
    const columnTasks = await this.getColumnTasks(data.columnId);
    const maxOrder =
      columnTasks.length > 0
        ? Math.max(...columnTasks.map((task) => task.order || 0))
        : 0;

    // Create task with calculated order
    return await addDocument(TASKS_COLLECTION, {
      ...data,
      status: "todo",
      isBlocked: false,
      order: maxOrder + 1,
      priority: data.priority || "medium",
    });
  },

  // Update a task
  async updateTask(id: string, data: UpdateTaskDTO) {
    // Handle clearing fields
    const updateData: any = { ...data };

    if (data.assigneeId === null) updateData.assigneeId = null;
    if (data.dueDate === null) updateData.dueDate = null;
    if (data.sprintId === null) updateData.sprintId = null;
    if (data.blockReason === null) updateData.blockReason = null;

    return await updateDocument(TASKS_COLLECTION, id, updateData);
  },

  // Delete a task
  async deleteTask(id: string) {
    return await deleteDocument(TASKS_COLLECTION, id);
  },
};
