export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  ownerId: string;
  members?: string[];
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  members?: string[];
}

export const projectService = {
  // Get all projects for a user
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      // Fetching projects
      
      const response = await fetch(`/api/projects?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error in getUserProjects: ${errorMessage}`, error);
      throw error;
    }
  },

  // Get a project by ID
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const response = await fetch(`/api/projects/${projectId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error fetching project ${projectId}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Create a new project
  async createProject(data: CreateProjectDTO): Promise<Project> {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error creating project: ${errorMessage}`, error);
      throw error;
    }
  },

  // Update a project
  async updateProject(id: string, data: UpdateProjectDTO): Promise<Project | null> {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error updating project ${id}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Delete a project
  async deleteProject(id: string): Promise<{ id: string }> {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }

      return { id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error deleting project ${id}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Add a member to a project
  async addProjectMember(projectId: string, userId: string): Promise<Project | null> {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add member: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error adding member ${userId} to project ${projectId}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Remove a member from a project
  async removeProjectMember(projectId: string, userId: string): Promise<Project | null> {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove member: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error removing member ${userId} from project ${projectId}: ${errorMessage}`, error);
      throw error;
    }
  },
};
