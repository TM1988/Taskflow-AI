// types/task.ts
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  columnId: string;
  projectId: string;
  assigneeId?: string;
  assigneeName?: string; // Added
  status?: string; // Added
  dueDate?: string | Date;
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  order?: number;
  commentCount?: number;
  completedAt?: string | Date; // Added
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
