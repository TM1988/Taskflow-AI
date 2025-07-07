import { NextRequest, NextResponse } from "next/server";
import {
  getUserDatabaseConnection,
  getOrganizationDatabaseConnection,
  getAdminDb,
} from "@/services/db/dynamicConnection";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

// Helper function to get the database connection based on project organization - COPIED FROM BOARD API
async function getDatabaseForProject(
  projectId: string,
  options: { userId?: string; organizationId?: string },
) {
  const { userId, organizationId: directOrganizationId } = options;
  try {
    console.log(
      `[WORKLOAD API getDatabaseForProject] Project: ${projectId}, UserID: ${userId}, DirectOrgID: ${directOrganizationId}`,
    );

    if (directOrganizationId) {
      console.log(
        `[WORKLOAD API getDatabaseForProject] Using directOrganizationId: ${directOrganizationId} for project ${projectId}.`,
      );
      return await getOrganizationDatabaseConnection(directOrganizationId);
    }

    // If no directOrganizationId, try Firestore lookup
    console.log(
      `[WORKLOAD API getDatabaseForProject] No directOrganizationId. Fetching project ${projectId} from Firestore to find its organization.`,
    );
    const projectDocRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      const project = projectDoc.data();
      // Use JSON.stringify to ensure the whole object is logged
      console.log(
        `[WORKLOAD API getDatabaseForProject] Project ${projectId} found in Firestore. Data:`,
        JSON.stringify(project, null, 2),
      );
      if (project.organizationId) {
        console.log(
          `[WORKLOAD API getDatabaseForProject] Project ${projectId} has organizationId: ${project.organizationId} from Firestore. Using organization database.`,
        );
        return await getOrganizationDatabaseConnection(project.organizationId);
      } else {
        console.log(
          `[WORKLOAD API getDatabaseForProject] Project ${projectId} found in Firestore but has no organizationId.`,
        );
      }
    } else {
      console.log(
        `[WORKLOAD API getDatabaseForProject] Project ${projectId} not found in Firestore.`,
      );
    }

    // Fallbacks if organizationId couldn't be determined
    if (userId) {
      console.log(
        `[WORKLOAD API getDatabaseForProject] Falling back to user database for userId: ${userId} (project ${projectId}).`,
      );
      return await getUserDatabaseConnection(userId);
    } else {
      console.warn(
        `[WORKLOAD API getDatabaseForProject] No userId provided for fallback, and project ${projectId} could not be associated with an organization. Falling back to admin database.`,
      );
      return await getAdminDb();
    }
  } catch (error) {
    console.error(
      `[WORKLOAD API getDatabaseForProject] Error determining database for project ${projectId}:`,
      error,
    );
    console.warn(
      `[WORKLOAD API getDatabaseForProject] Falling back to admin database due to an error for project ${projectId}.`,
    );
    return await getAdminDb(); // Fallback on error
  }
}

// Helper function to get the correct project ID for database operations - COPIED FROM BOARD API
async function getMongoProjectId(firebaseProjectId: string): Promise<string> {
  try {
    // Check if this is a Firebase ID that has a corresponding MongoDB ID
    if (firebaseProjectId.length < 25) {
      // Firebase IDs are shorter than MongoDB ObjectIds
      console.log(
        `[WORKLOAD API getMongoProjectId] Project ID ${firebaseProjectId} looks like Firebase ID, checking for MongoDB mapping...`,
      );
      const projectDocRef = doc(db, "projects", firebaseProjectId);
      const projectDoc = await getDoc(projectDocRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        if (projectData.customDbProjectId) {
          console.log(
            `[WORKLOAD API getMongoProjectId] Found MongoDB project ID: ${projectData.customDbProjectId} for Firebase ID: ${firebaseProjectId}`,
          );
          return projectData.customDbProjectId;
        }
      }
    }

    // If no mapping found, return the original ID
    console.log(
      `[WORKLOAD API getMongoProjectId] Using original project ID: ${firebaseProjectId}`,
    );
    return firebaseProjectId;
  } catch (error) {
    console.log(
      `[WORKLOAD API getMongoProjectId] Error checking Firebase mapping:`,
      error,
    );
    return firebaseProjectId;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const memberId = searchParams.get("memberId");
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");

    console.log(`[WORKLOAD API] Request params:`, {
      projectId,
      memberId,
      organizationId,
      userId,
    });

    if (!projectId || !memberId) {
      return NextResponse.json(
        { error: "Project ID and member ID are required" },
        { status: 400 },
      );
    }

    // Get project data to find member's task limit
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      console.log(
        `[WORKLOAD API] Project not found in Firestore: ${projectId}`,
      );
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();
    const members = projectData.members || [];

    console.log(`[WORKLOAD API] Project members:`, members);
    console.log(`[WORKLOAD API] Project owner:`, projectData.ownerId);
    console.log(`[WORKLOAD API] Looking for member:`, memberId);

    // Check if member exists in project (members is array of user IDs)
    if (!members.includes(memberId) && projectData.ownerId !== memberId) {
      console.log(`[WORKLOAD API] Member not found in project`);
      return NextResponse.json(
        { error: "Member not found in project" },
        { status: 404 },
      );
    }

    // Get task limit from member settings or default
    const memberSettings = projectData.memberSettings?.[memberId];
    const taskLimit = memberSettings?.taskLimit || 10; // Default to 10 if not set

    console.log(`[WORKLOAD API] Member settings:`, memberSettings);
    console.log(`[WORKLOAD API] Task limit:`, taskLimit);

    // Use SAME database connection logic as board API
    const database = await getDatabaseForProject(projectId, {
      userId: userId || undefined,
      organizationId: organizationId || undefined,
    });

    if (!database) {
      console.error(`[WORKLOAD API] Failed to get database connection`);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Get the correct MongoDB project ID using SAME logic as board API
    const mongoProjectId = await getMongoProjectId(projectId);
    console.log(
      `[WORKLOAD API] Using mongoProjectId: ${mongoProjectId} for database operations`,
    );

    console.log(
      `[WORKLOAD API] Querying tasks for project: ${mongoProjectId}, member: ${memberId}`,
    );

    // Query tasks with SAME logic as board API - try mongoProjectId first
    let activeTasks = await database
      .collection("tasks")
      .find({
        projectId: mongoProjectId,
        assigneeId: memberId,
        status: { $ne: "completed" },
      })
      .toArray();

    console.log(
      `[WORKLOAD API] Found ${activeTasks.length} active tasks with mongoProjectId`,
    );

    // If no tasks found with mongoProjectId, try with original projectId (same logic as board API)
    if (activeTasks.length === 0) {
      console.log(
        `[WORKLOAD API] No tasks found with mongoProjectId, trying original projectId...`,
      );
      activeTasks = await database
        .collection("tasks")
        .find({
          projectId: projectId,
          assigneeId: memberId,
          status: { $ne: "completed" },
        })
        .toArray();

      console.log(
        `[WORKLOAD API] Found ${activeTasks.length} active tasks with original projectId`,
      );
    }

    console.log(
      `[WORKLOAD API] Active tasks found:`,
      activeTasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        assigneeId: t.assigneeId,
        projectId: t.projectId,
      })),
    );

    // Get completed tasks this week (using same projectId logic)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let completedThisWeek = await database
      .collection("tasks")
      .find({
        projectId: mongoProjectId,
        assigneeId: memberId,
        status: "completed",
        completedAt: { $gte: oneWeekAgo.toISOString() },
      })
      .toArray();

    // Try original projectId if no results
    if (completedThisWeek.length === 0) {
      completedThisWeek = await database
        .collection("tasks")
        .find({
          projectId: projectId,
          assigneeId: memberId,
          status: "completed",
          completedAt: { $gte: oneWeekAgo.toISOString() },
        })
        .toArray();
    }

    console.log(
      `[WORKLOAD API] Found ${completedThisWeek.length} completed tasks this week`,
    );

    // Get overdue tasks (using same projectId logic)
    const now = new Date().toISOString();
    let overdueTasks = await database
      .collection("tasks")
      .find({
        projectId: mongoProjectId,
        assigneeId: memberId,
        status: { $ne: "completed" },
        dueDate: { $lt: now },
      })
      .toArray();

    // Try original projectId if no results
    if (overdueTasks.length === 0) {
      overdueTasks = await database
        .collection("tasks")
        .find({
          projectId: projectId,
          assigneeId: memberId,
          status: { $ne: "completed" },
          dueDate: { $lt: now },
        })
        .toArray();
    }

    console.log(`[WORKLOAD API] Found ${overdueTasks.length} overdue tasks`);

    const assignedTasks = activeTasks.length;
    const workloadPercentage = Math.round((assignedTasks / taskLimit) * 100);

    console.log(`[WORKLOAD API] Final calculation:`, {
      assignedTasks,
      taskLimit,
      workloadPercentage,
      completedThisWeek: completedThisWeek.length,
      overdueTasks: overdueTasks.length,
    });

    const response = {
      assignedTasks,
      activeTasks: assignedTasks, // Add this for compatibility
      taskLimit,
      capacity: taskLimit, // Add this for compatibility
      workloadPercentage,
      completedThisWeek: completedThisWeek.length,
      overdueTasks: overdueTasks.length,
      tasks: activeTasks.map((task: any) => ({
        id: task._id.toString(),
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
      })),
    };

    console.log(`[WORKLOAD API] Returning response:`, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[WORKLOAD API] Error fetching member workload:", error);
    return NextResponse.json(
      { error: "Failed to fetch member workload" },
      { status: 500 },
    );
  }
}
