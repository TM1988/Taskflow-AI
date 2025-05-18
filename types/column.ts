// types/column.ts
export interface Column {
  id: string;
  name: string;
  projectId: string;
  order: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
