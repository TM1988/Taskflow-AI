import {
  getDocument,
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
} from "@/services/db/mongodb";
import { Task } from "@/types/mongodb-types";

export interface CreateTaskDTO {
  title: string;
  description?: string;
  projectId: string;
  columnId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  isBlocked?: boolean;
  order?: number;
  dueDate?: Date | null;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  columnId?: string;
  status?: 'todo' | 'in-progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high';
  isBlocked?: boolean;
  order?: number;
  dueDate?: Date | null;
}

export const taskService = {
  async getTask(id: string) {
    return await getDocument("tasks", id);
  },

  async getTasks(whereConditions: [string, any, any][] = []) {
    return await getDocuments("tasks", whereConditions, "order", "asc");
  },

  async createTask(taskData: any) {
    return await addDocument("tasks", taskData);
  },

  async updateTask(id: string, updates: any) {
    return await updateDocument("tasks", id, updates);
  },

  async deleteTask(id: string) {
    return await deleteDocument("tasks", id);
  },
};