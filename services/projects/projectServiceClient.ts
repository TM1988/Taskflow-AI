import { Project } from "@/types/project";

interface CreateProjectDTO {
  name: string;
  description?: string;
  ownerId: string;
  members?: string[];
}

interface UpdateProjectDTO {
  name?: string;
  description?: string;
  members?: string[];
}

export const projectServiceClient = {
  // Get all projects for a user
  async getUserProjects(userId: string): Promise<Project[]> {
    const response = await fetch(`/api/projects?userId=${userId}`);

    if (!response.ok) {
      console.error(
        "Failed to fetch projects:",
        response.status,
        response.statusText,
      );
      throw new Error("Failed to fetch projects");
    }

    return await response.json();
  },

  // Get a project by ID
  async getProject(projectId: string): Promise<Project | null> {
    const response = await fetch(`/api/projects/${projectId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error(
        "Failed to fetch project:",
        response.status,
        response.statusText,
      );
      throw new Error("Failed to fetch project");
    }

    return await response.json();
  },

  // Create a new project
  async createProject(data: CreateProjectDTO): Promise<Project> {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(
        "Failed to create project:",
        response.status,
        response.statusText,
      );
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create project");
    }

    return await response.json();
  },

  // Update an existing project
  async updateProject(
    projectId: string,
    data: UpdateProjectDTO,
  ): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(
        "Failed to update project:",
        response.status,
        response.statusText,
      );
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update project");
    }

    return await response.json();
  },

  // Delete a project
  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error(
        "Failed to delete project:",
        response.status,
        response.statusText,
      );
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete project");
    }
  },

  // Add a member to a project
  async addProjectMember(
    projectId: string,
    memberId: string,
  ): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });

    if (!response.ok) {
      console.error(
        "Failed to add project member:",
        response.status,
        response.statusText,
      );
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to add member to project");
    }

    return await response.json();
  },

  // Remove a member from a project
  async removeProjectMember(
    projectId: string,
    memberId: string,
  ): Promise<Project> {
    const response = await fetch(
      `/api/projects/${projectId}/members/${memberId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to remove project member:",
        response.status,
        response.statusText,
      );
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to remove member from project",
      );
    }

    return await response.json();
  },
};
