import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";
import { db } from "@/config/firebase"; // Added for Firestore access
import { doc, getDoc } from "firebase/firestore"; // Added for Firestore access

// Helper function to get the database connection based on project organization
async function getDatabaseForProject(projectId: string, userId?: string) {
  try {
    const projectDocRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);
    
    if (projectDoc.exists()) {
      const project = projectDoc.data();
      if (project.organizationId) {
        console.log(`[DIRECT API] Task's project ${projectId} belongs to organization ${project.organizationId}`);
        return await getOrganizationDatabaseConnection(project.organizationId);
      }
    }
    
    if (userId) {
      console.log(`[DIRECT API] Task's project ${projectId} not in org or no orgId, using user database for ${userId}`);
      return await getUserDatabaseConnection(userId);
    }
    
    console.log(`[DIRECT API] Task's project ${projectId} using admin database as fallback`);
    return await getAdminDb();
  } catch (error) {
    console.error("[DIRECT API] Error determining database for project:", error);
    return await getAdminDb(); // Fallback to admin DB on error
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const taskId = params.taskId;
  console.log(`[DIRECT API] Loading task ${taskId}`);

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId'); // Get organizationId from params
    const projectId = searchParams.get('projectId'); // Get projectId from params

    console.log(`[DIRECT API] Context: taskId=${taskId}, userId=${userId}, orgId=${organizationId}, projId=${projectId}`);

    let database;
    
    // If organizationId is provided, use it directly
    if (organizationId) {
      console.log(`[DIRECT API] Using organization DB for org: ${organizationId}`);
      database = await getOrganizationDatabaseConnection(organizationId);
    } else if (projectId) {
      // If projectId is provided, use getDatabaseForProject to determine the correct DB
      console.log(`[DIRECT API] Determining DB for project: ${projectId}`);
      database = await getDatabaseForProject(projectId, userId || undefined);
    } else {
      // Fallback: try to find task in user DB or admin DB
      console.log(`[DIRECT API] No org/project context, trying user/admin DB`);
      database = userId ? await getUserDatabaseConnection(userId) : await getAdminDb();
    }
    
    if (!database) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Try tasks collection first
    let task = await database.collection("tasks").findOne({ _id: new ObjectId(taskId) });
    let isPersonalTask = false;

    // If not found and no organizationId, try personalTasks collection
    if (!task && !organizationId) {
      task = await database.collection("personalTasks").findOne({ _id: new ObjectId(taskId) });
      isPersonalTask = true;
    }

    if (!task) {
      console.log(`[DIRECT API] Task ${taskId} not found in any collection`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const result = {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      projectId: task.projectId || (isPersonalTask ? "personal" : null),
      columnId: task.columnId || 'todo',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      order: task.order || 0,
      isBlocked: task.isBlocked || false,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
    };

    console.log(`[DIRECT API] Successfully loaded task ${taskId}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[DIRECT API] Error loading task:`, error);
    if (error instanceof Error && error.message.includes("Argument passed in must be a string of 12 bytes")) {
      return NextResponse.json({ error: "Invalid Task ID format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to load task" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const taskId = params.taskId;
  console.log(`[DIRECT API] Updating task ${taskId}`);

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const personal = searchParams.get('personal');

    const updateData = await request.json();
    
    let database;
    let collection = "tasks";
    let isPersonalTask = false;

    // Handle personal tasks
    if (personal === "true" && userId) {
      database = await getUserDatabaseConnection(userId);
      collection = "personalTasks";
      isPersonalTask = true;
      console.log(`[DIRECT API] Updating personal task ${taskId} for user ${userId}`);
    } else if (organizationId) {
      database = await getOrganizationDatabaseConnection(organizationId);
      console.log(`[DIRECT API] Updating task ${taskId} in organization ${organizationId}`);
    } else {
      // Try to find the task to determine which database to use
      const adminDb = await getAdminDb();
      const task = await adminDb.collection("tasks").findOne({ _id: new ObjectId(taskId) });
      
      if (task) {
        if (task.projectId && task.projectId !== "personal") {
          database = await getDatabaseForProject(task.projectId, userId || undefined);
        } else {
          database = userId ? await getUserDatabaseConnection(userId) : adminDb;
          if (userId) {
            collection = "personalTasks";
            isPersonalTask = true;
          }
        }
      } else {
        // Try personal tasks
        if (userId) {
          const userDb = await getUserDatabaseConnection(userId);
          const personalTask = await userDb?.collection("personalTasks").findOne({ _id: new ObjectId(taskId) });
          if (personalTask) {
            database = userDb;
            collection = "personalTasks";
            isPersonalTask = true;
          }
        }
      }
    }

    if (!database) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Get current task to check status change
    const currentTask = await database.collection(collection).findOne({ _id: new ObjectId(taskId) });
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data
    const updates: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Set completedAt if task is being marked as completed
    const isBeingCompleted = (updateData.status === 'done' || updateData.status === 'completed') && 
                            (currentTask.status !== 'done' && currentTask.status !== 'completed');
    
    if (isBeingCompleted) {
      updates.completedAt = new Date();
      console.log(`[DIRECT API] Task ${taskId} being marked as completed, setting completedAt`);
    }

    // Clear completedAt if task is being moved away from completed status
    const isBeingUncompleted = (updateData.status && updateData.status !== 'done' && updateData.status !== 'completed') &&
                              (currentTask.status === 'done' || currentTask.status === 'completed');
    
    if (isBeingUncompleted) {
      updates.completedAt = null;
      console.log(`[DIRECT API] Task ${taskId} being moved away from completed status, clearing completedAt`);
    }

    // Convert dates
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const result = await database.collection(collection).updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get updated task
    const updatedTask = await database.collection(collection).findOne({ _id: new ObjectId(taskId) });

    const response = {
      id: updatedTask!._id.toString(),
      title: updatedTask!.title,
      description: updatedTask!.description || "",
      projectId: updatedTask!.projectId || (isPersonalTask ? "personal" : null),
      columnId: updatedTask!.columnId || 'todo',
      status: updatedTask!.status || 'todo',
      priority: updatedTask!.priority || 'medium',
      order: updatedTask!.order || 0,
      isBlocked: updatedTask!.isBlocked || false,
      dueDate: updatedTask!.dueDate ? new Date(updatedTask!.dueDate).toISOString() : null,
      completedAt: updatedTask!.completedAt ? new Date(updatedTask!.completedAt).toISOString() : null,
      createdAt: updatedTask!.createdAt ? new Date(updatedTask!.createdAt).toISOString() : null,
      updatedAt: updatedTask!.updatedAt ? new Date(updatedTask!.updatedAt).toISOString() : null,
    };

    console.log(`[DIRECT API] Successfully updated task ${taskId}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error(`[DIRECT API] Error updating task:`, error);
    if (error instanceof Error && error.message.includes("Argument passed in must be a string of 12 bytes")) {
      return NextResponse.json({ error: "Invalid Task ID format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
