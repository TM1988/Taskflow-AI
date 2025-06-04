import { getMongoDb } from "@/services/singleton";
import { Task } from "@/types/task";
import { ObjectId } from "mongodb";

export const dashboardService = {
  // Get comprehensive project stats for dashboard
  async getProjectStats(userId: string) {
    try {
      const { mongoDb } = await getMongoDb();

      // Get user projects
      const projects = await mongoDb
        .collection("projects")
        .find({ members: { $in: [userId] } })
        .toArray();

      // Get tasks for all projects
      const projectIds = projects.map((project) => project._id.toString());
      const allTasks = await mongoDb
        .collection("tasks")
        .find({ projectId: { $in: projectIds } })
        .toArray();

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
