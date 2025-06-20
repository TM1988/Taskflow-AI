import {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

export type FirestoreDocumentSnapshot = DocumentSnapshot;
export type FirestoreQueryDocumentSnapshot = QueryDocumentSnapshot;

export interface MongoDocument {
  _id?: string;
  id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task extends MongoDocument {
  title: string;
  description?: string;
  projectId: string;
  columnId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  isBlocked: boolean;
  order: number;
  dueDate?: Date | null;
}

export interface Column extends MongoDocument {
  name: string;
  projectId: string;
  order: number;
}

export interface Project extends MongoDocument {
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  memberCount: number;
  projects: string[];
  settings: {
    isPublic: boolean;
    allowMemberInvites: boolean;
    requireApprovalForJoining: boolean;
    useSelfHosting?: boolean; // New field for per-organization storage
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}
