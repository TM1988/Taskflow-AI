import { NextRequest, NextResponse } from "next/server";
import {
  getUserDatabaseConnection,
  getOrganizationDatabaseConnection,
  getAdminDb,
} from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

// Helper function to get the database connection based on project organization
async function getDatabaseForProject(projectId: string, userId?: string) {
  try {
    const projectDocRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      const project = projectDoc.data();
      if (project.organizationId) {
        console.log(
          `[TASK DETAILS API] Task's project ${projectId} belongs to organization ${project.organizationId}`,
        );
        return await getOrganizationDatabaseConnection(project.organizationId);
      }
    }

    if (userId) {
      console.log(
        `[TASK DETAILS API] Task's project ${projectId} not in org or no orgId, using user database for ${userId}`,
      );
      return await getUserDatabaseConnection(userId);
    }

    console.log(
      `[TASK DETAILS API] Task's project ${projectId} using admin database as fallback`,
    );
    return await getAdminDb();
  } catch (error) {
    console.error(
      "[TASK DETAILS API] Error determining database for project:",
      error,
    );
    return await getAdminDb(); // Fallback to admin DB on error
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const taskId = params.taskId;
  console.log("[TASK DETAILS API] Fetching task details for ID:", taskId);

  if (!taskId) {
    console.log("[TASK DETAILS API] No taskId provided");
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");
    const projectId = searchParams.get("projectId");

    console.log(
      `[TASK DETAILS API] Context: taskId=${taskId}, userId=${userId}, orgId=${organizationId}, projId=${projectId}`,
    );

    let database;

    // If organizationId is provided, use it directly
    if (organizationId) {
      console.log(
        `[TASK DETAILS API] Using organization DB for org: ${organizationId}`,
      );
      database = await getOrganizationDatabaseConnection(organizationId);
    } else if (projectId) {
      // If projectId is provided, use getDatabaseForProject to determine the correct DB
      console.log(
        `[TASK DETAILS API] Determining DB for project: ${projectId}`,
      );
      database = await getDatabaseForProject(projectId, userId || undefined);
    } else {
      // Fallback: try to find task in user DB or admin DB
      console.log(
        `[TASK DETAILS API] No org/project context, trying user/admin DB`,
      );
      database = userId
        ? await getUserDatabaseConnection(userId)
        : await getAdminDb();
    }

    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Try tasks collection first
    let task = await database
      .collection("tasks")
      .findOne({ _id: new ObjectId(taskId) });
    let isPersonalTask = false;

    // If not found and no organizationId, try personalTasks collection
    if (!task && !organizationId) {
      task = await database
        .collection("personalTasks")
        .findOne({ _id: new ObjectId(taskId) });
      isPersonalTask = true;
    }

    if (!task) {
      console.log(
        `[TASK DETAILS API] Task ${taskId} not found in any collection`,
      );
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Return all task data with proper serialization
    const serializedData = {
      ...task,
      id: task._id.toString(),
      _id: undefined,
      projectId: task.projectId || (isPersonalTask ? "personal" : null),
      columnId: task.columnId || "todo",
      status: task.status || "todo",
      priority: task.priority || "medium",
      order: task.order || 0,
      isBlocked: task.isBlocked || false,
      assigneeId: task.assigneeId || null,
      assigneeName: task.assigneeName || null,
      assignee: task.assignee || null,
      tags: task.tags || [],
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
    };

    console.log(`[TASK DETAILS API] Successfully fetched task ${taskId}`);
    return NextResponse.json(serializedData);
  } catch (error) {
    console.error("[TASK DETAILS API] Error fetching task details:", error);

    if (
      error instanceof Error &&
      error.message.includes("Argument passed in must be a string of 12 bytes")
    ) {
      return NextResponse.json(
        { error: "Invalid Task ID format" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch task details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
