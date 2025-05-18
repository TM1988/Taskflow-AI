import { adminDb } from "@/services/admin/firebaseAdmin";
import { Task } from "@/types/task";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export const dashboardService = {
  // Get comprehensive project stats for dashboard
  async getProjectStats(userId: string) {
    try {
      // Get user projects
      const projectsSnapshot = await adminDb
        .collection("projects")
        .where("members", "array-contains", userId)
        .get();

      const projects = projectsSnapshot.docs.map(
        (doc: FirestoreQueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        }),
      );

      // Get tasks for all projects
      const tasksPromises = projects.map(async (project: { id: string }) => {
        const tasksSnapshot = await adminDb
          .collection("tasks")
          .where("projectId", "==", project.id)
          .get();

        return tasksSnapshot.docs.map(
          (doc: FirestoreQueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );
      });

      const projectTasks = await Promise.all(tasksPromises);
      const allTasks = projectTasks.flat() as Task[];

      // Calculate statistics
      const tasksByStatus = {
        todo: allTasks.filter((t) => t.status === "todo").length,
        inProgress: allTasks.filter((t) => t.status === "in-progress").length,
        review: allTasks.filter((t) => t.status === "review").length,
        done: allTasks.filter((t) => t.status === "done").length,
        blocked: allTasks.filter((t) => t.status === "blocked").length,
      };

      const tasksByPriority = {
        high: allTasks.filter((t) => t.priority === "high").length,
        medium: allTasks.filter((t) => t.priority === "medium").length,
        low: allTasks.filter((t) => t.priority === "low").length,
      };

      // Recently completed tasks
      const recentlyCompleted = allTasks
        .filter((t) => t.status === "done")
        .sort((a, b) => {
          const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);

      // Upcoming tasks (due soon)
      const upcoming = allTasks
        .filter((t) => t.status !== "done" && t.dueDate)
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return dateA - dateB;
        })
        .slice(0, 5);

      return {
        projectCount: projects.length,
        taskCount: allTasks.length,
        tasksByStatus,
        tasksByPriority,
        recentlyCompleted,
        upcoming,
        completionRate:
          allTasks.length > 0
            ? (tasksByStatus.done / allTasks.length) * 100
            : 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },
};
