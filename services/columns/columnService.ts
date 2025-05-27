import { Column } from "@/types/mongodb-types";

export interface CreateColumnDTO {
  name: string;
  projectId: string;
  organizationId?: string;
  order?: number;
}

export interface UpdateColumnDTO {
  name?: string;
  order?: number;
}

export const columnService = {
  // Get all columns for a project
  async getProjectColumns(projectId: string): Promise<Column[]> {
    try {
      const response = await fetch(`/api/db/columns?${new URLSearchParams({
        where: JSON.stringify([["projectId", "==", projectId]]),
        orderBy: "order",
        orderDirection: "asc"
      })}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch columns: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error fetching columns for project ${projectId}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Create a new column
  async createColumn(data: CreateColumnDTO): Promise<Column> {
    try {
      const response = await fetch('/api/db/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create column: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error creating column: ${errorMessage}`, error);
      throw error;
    }
  },

  // Update a column
  async updateColumn(id: string, data: UpdateColumnDTO): Promise<Column | null> {
    try {
      const response = await fetch(`/api/db/columns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update column: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error updating column ${id}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Delete a column
  async deleteColumn(id: string): Promise<{ id: string }> {
    try {
      const response = await fetch(`/api/db/columns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete column: ${response.statusText}`);
      }

      return { id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error deleting column ${id}: ${errorMessage}`, error);
      throw error;
    }
  },
};
