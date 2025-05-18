import {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocument,
} from "@/services/db/firestore";

const COLUMNS_COLLECTION = "columns";

export interface CreateColumnDTO {
  name: string;
  projectId: string;
  order: number;
}

export interface UpdateColumnDTO {
  name?: string;
  order?: number;
}

export const columnService = {
  // Get all columns for a project
  async getProjectColumns(projectId: string) {
    return await getDocuments(
      COLUMNS_COLLECTION,
      [["projectId", "==", projectId]],
      "order",
    );
  },

  // Get a column by ID
  async getColumn(columnId: string) {
    return await getDocument(COLUMNS_COLLECTION, columnId);
  },

  // Create a new column
  async createColumn(data: CreateColumnDTO) {
    // Calculate order if not provided
    if (data.order === undefined) {
      const columns = await this.getProjectColumns(data.projectId);
      const maxOrder =
        columns.length > 0
          ? Math.max(...columns.map((col) => col.order || 0))
          : -1;
      data.order = maxOrder + 1;
    }

    return await addDocument(COLUMNS_COLLECTION, data);
  },

  // Update a column
  async updateColumn(id: string, data: UpdateColumnDTO) {
    return await updateDocument(COLUMNS_COLLECTION, id, data);
  },

  // Delete a column
  async deleteColumn(id: string) {
    return await deleteDocument(COLUMNS_COLLECTION, id);
  },
};
