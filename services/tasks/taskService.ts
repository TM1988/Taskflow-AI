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
  async getTask(id: string, userId?: string) {
    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId);
    }

    const response = await fetch(`/api/task-direct/${id}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to get task: ${response.statusText}`);
    }
    
    return await response.json();
  },

  async getTasks(whereConditions: [string, any, any][] = [], userId?: string) {
    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId);
    }

    // Convert where conditions to query parameters if needed
    // For now, we'll use the /api/tasks endpoint which has its own filtering logic
    whereConditions.forEach(([field, operator, value], index) => {
      if (field === 'projectId') {
        params.append('projectId', value);
      } else if (field === 'columnId') {
        params.append('columnId', value);
      }
      // Add more field mappings as needed
    });

    const response = await fetch(`/api/tasks?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    
    return await response.json();
  },

  async createTask(taskData: any, userId?: string) {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskData, userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return await response.json();
  },

  async updateTask(id: string, updates: any, userId?: string) {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return await response.json();
  },

  async deleteTask(id: string, userId?: string) {
    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId);
    }

    const response = await fetch(`/api/tasks/${id}?${params.toString()}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }

    return { success: true };
  },
};