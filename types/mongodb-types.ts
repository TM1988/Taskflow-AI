export interface MongoDocument {
  _id?: string;
  id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoQueryResult<T = any> {
  docs: T[];
  totalCount: number;
}

export interface Task extends MongoDocument {
  title: string;
  description: string;
  projectId: string;
  organizationId?: string;
  columnId: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  isBlocked: boolean;
  order: number;
  dueDate?: Date | null;
}

export interface Column extends MongoDocument {
  name: string;
  projectId: string;
  organizationId?: string;
  order: number;
}

export interface Project extends MongoDocument {
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  members: string[];
}

export interface Organization extends MongoDocument {
  name: string;
  description?: string;
  ownerId: string;
  members: {
    userId: string;
    role: 'Owner' | 'Admin' | 'Member';
    joinedAt: Date;
  }[];
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
  joinedAt: Date;
  avatar?: string;
}
