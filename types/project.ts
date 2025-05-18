// types/project.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
