import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

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
      console.log(`Fetching projects for user: ${userId}`);

      // First check if we have any projects at all (for debugging)
      const allProjects = await adminDb.collection("projects").limit(5).get();
      console.log(
        `Found ${allProjects.docs.length} total projects in database`,
      );

      // Get projects where user is owner
      const ownerProjectsSnapshot = await adminDb
        .collection("projects")
        .where("ownerId", "==", userId)
        .get();

      const ownerProjects = ownerProjectsSnapshot.docs.map(
        (doc: FirestoreQueryDocumentSnapshot) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }),
      ) as Project[];

      console.log(`Found ${ownerProjects.length} projects where user is owner`);

      // Get projects where user is a member
      const memberProjectsSnapshot = await adminDb
        .collection("projects")
        .where("members", "array-contains", userId)
        .get();

      const memberProjects = memberProjectsSnapshot.docs.map(
        (doc: FirestoreQueryDocumentSnapshot) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }),
      ) as Project[];

      console.log(
        `Found ${memberProjects.length} projects where user is a member`,
      );

      // Combine and remove duplicates
      const projects = [...ownerProjects];
      memberProjects.forEach((project) => {
        if (!projects.some((p) => p.id === project.id)) {
          projects.push(project);
        }
      });

      // If no projects, create a default project
      if (projects.length === 0) {
        console.log(
          `No projects found for user ${userId}, creating a default project`,
        );
        const defaultProject = await this.createDefaultProject(userId);
        return [defaultProject];
      }

      return projects;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error in getUserProjects: ${errorMessage}`, error);
      throw error;
    }
  },

  // Create a default project with columns for new users
  async createDefaultProject(userId: string): Promise<Project> {
    try {
      // Create project
      const projectRef = adminDb.collection("projects").doc();
      const projectData = {
        name: "My First Project",
        description: "TaskFlow AI default project",
        ownerId: userId,
        members: [userId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await projectRef.set(projectData);
      const project = { id: projectRef.id, ...projectData };

      // Create default columns
      const columns = ["To Do", "In Progress", "Review", "Done"];
      for (let i = 0; i < columns.length; i++) {
        const columnRef = adminDb.collection("columns").doc();
        await columnRef.set({
          name: columns[i],
          projectId: projectRef.id,
          order: i,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return project as Project;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error creating default project: ${errorMessage}`, error);
      throw error;
    }
  },

  // Get a project by ID
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await adminDb
        .collection("projects")
        .doc(projectId)
        .get();

      if (!projectDoc.exists) {
        return null;
      }

      return {
        id: projectDoc.id,
        ...(projectDoc.data() as Omit<Project, "id">),
      } as Project;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(
        `Error fetching project ${projectId}: ${errorMessage}`,
        error,
      );
      throw error;
    }
  },

  // Create a new project
  async createProject(data: CreateProjectDTO): Promise<Project> {
    try {
      const projectRef = adminDb.collection("projects").doc();
      const projectData = {
        ...data,
        members: data.members || [data.ownerId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await projectRef.set(projectData);

      return {
        id: projectRef.id,
        ...projectData,
      } as Project;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error creating project: ${errorMessage}`, error);
      throw error;
    }
  },

  // Update a project
  async updateProject(
    id: string,
    data: UpdateProjectDTO,
  ): Promise<Project | null> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await adminDb.collection("projects").doc(id).update(updateData);

      return await this.getProject(id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error updating project ${id}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Delete a project
  async deleteProject(id: string): Promise<{ id: string }> {
    try {
      await adminDb.collection("projects").doc(id).delete();
      return { id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error deleting project ${id}: ${errorMessage}`, error);
      throw error;
    }
  },

  // Add a member to a project
  async addProjectMember(
    projectId: string,
    userId: string,
  ): Promise<Project | null> {
    try {
      const projectRef = adminDb.collection("projects").doc(projectId);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data() as Omit<Project, "id">;
      const members = projectData?.members || [];

      if (!members.includes(userId)) {
        members.push(userId);
        await projectRef.update({
          members,
          updatedAt: new Date(),
        });
      }

      return await this.getProject(projectId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(
        `Error adding member ${userId} to project ${projectId}: ${errorMessage}`,
        error,
      );
      throw error;
    }
  },

  // Remove a member from a project
  async removeProjectMember(
    projectId: string,
    userId: string,
  ): Promise<Project | null> {
    try {
      const projectRef = adminDb.collection("projects").doc(projectId);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data() as Omit<Project, "id">;
      const members = projectData?.members || [];
      const updatedMembers = members.filter((id: string) => id !== userId);

      await projectRef.update({
        members: updatedMembers,
        updatedAt: new Date(),
      });

      return await this.getProject(projectId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(
        `Error removing member ${userId} from project ${projectId}: ${errorMessage}`,
        error,
      );
      throw error;
    }
  },
};
