// app/api/board/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

// Helper function to get the database connection based on project organization
async function getDatabaseForProject(projectId: string, options: { userId?: string, organizationId?: string }) {
  const { userId, organizationId: directOrganizationId } = options;
  try {
    console.log(`[getDatabaseForProject] Project: ${projectId}, UserID: ${userId}, DirectOrgID: ${directOrganizationId}`);

    if (directOrganizationId) {
      console.log(`[getDatabaseForProject] Using directOrganizationId: ${directOrganizationId} for project ${projectId}.`);
      return await getOrganizationDatabaseConnection(directOrganizationId);
    }

    // If no directOrganizationId, try Firestore lookup
    console.log(`[getDatabaseForProject] No directOrganizationId. Fetching project ${projectId} from Firestore to find its organization.`);
    const projectDocRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      const project = projectDoc.data();
      // Use JSON.stringify to ensure the whole object is logged
      console.log(`[getDatabaseForProject] Project ${projectId} found in Firestore. Data:`, JSON.stringify(project, null, 2));
      if (project.organizationId) {
        console.log(`[getDatabaseForProject] Project ${projectId} has organizationId: ${project.organizationId} from Firestore. Using organization database.`);
        return await getOrganizationDatabaseConnection(project.organizationId);
      } else {
        console.log(`[getDatabaseForProject] Project ${projectId} found in Firestore but has no organizationId.`);
      }
    } else {
      console.log(`[getDatabaseForProject] Project ${projectId} not found in Firestore.`);
    }

    // Fallbacks if organizationId couldn't be determined
    if (userId) {
      console.log(`[getDatabaseForProject] Falling back to user database for userId: ${userId} (project ${projectId}).`);
      return await getUserDatabaseConnection(userId);
    } else {
      console.warn(`[getDatabaseForProject] No userId provided for fallback, and project ${projectId} could not be associated with an organization. Falling back to admin database.`);
      return await getAdminDb();
    }
  } catch (error) {
    console.error(`[getDatabaseForProject] Error determining database for project ${projectId}:`, error);
    console.warn(`[getDatabaseForProject] Falling back to admin database due to an error for project ${projectId}.`);
    return await getAdminDb(); // Fallback on error
  }
}

// Helper function to get the correct project ID for database operations
async function getMongoProjectId(firebaseProjectId: string): Promise<string> {
  try {
    // Check if this is a Firebase ID that has a corresponding MongoDB ID
    if (firebaseProjectId.length < 25) { // Firebase IDs are shorter than MongoDB ObjectIds
      console.log(`[getMongoProjectId] Project ID ${firebaseProjectId} looks like Firebase ID, checking for MongoDB mapping...`);
      const projectDocRef = doc(db, "projects", firebaseProjectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        if (projectData.customDbProjectId) {
          console.log(`[getMongoProjectId] Found MongoDB project ID: ${projectData.customDbProjectId} for Firebase ID: ${firebaseProjectId}`);
          return projectData.customDbProjectId;
        }
      }
    }
    
    // If no mapping found, return the original ID
    console.log(`[getMongoProjectId] Using original project ID: ${firebaseProjectId}`);
    return firebaseProjectId;
  } catch (error) {
    console.log(`[getMongoProjectId] Error checking Firebase mapping:`, error);
    return firebaseProjectId;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId'); // Extract organizationId

    console.log(`[api/board GET] Fetching board for project ${projectId}, user ${userId}, org ${organizationId}`);
    
    // Pass organizationId to getDatabaseForProject
    const database = await getDatabaseForProject(projectId, { userId: userId || undefined, organizationId: organizationId || undefined });
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Fetch tasks directly from tasks collection for this specific project
    console.log(`[api/board GET] Querying tasks with projectId: "${projectId}" (type: ${typeof projectId})`);
    
    let tasks = await database
      .collection("tasks")
      .find({ projectId: projectId })
      .toArray();

    console.log(`[api/board GET] Found ${tasks.length} tasks for project ${projectId} with string projectId`);
    
    // If no tasks found with string projectId, try with the project's MongoDB _id
    // This handles legacy tasks that were saved with the wrong projectId format
    if (tasks.length === 0) {
      console.log(`[api/board GET] No tasks found with string projectId, trying to find project's MongoDB _id...`);
      
      // Get the project from Firestore to find its customDbProjectId
      const projectDocRef = doc(db, "projects", projectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const customDbProjectId = projectData.customDbProjectId;
        
        if (customDbProjectId) {
          console.log(`[api/board GET] Found customDbProjectId: ${customDbProjectId}, querying tasks with this ID...`);
          const tasksWithCustomId = await database
            .collection("tasks")
            .find({ projectId: customDbProjectId })
            .toArray();
          
          console.log(`[api/board GET] Found ${tasksWithCustomId.length} tasks with customDbProjectId`);
          tasks = tasksWithCustomId;
        }
      }
    }
    
    // Final debug: if still no tasks, show what's in the database
    if (tasks.length === 0) {
      console.log(`[api/board GET] Still no tasks found, debugging by fetching all tasks...`);
      const allTasks = await database
        .collection("tasks")
        .find({})
        .limit(10) // Limit to avoid too much logging
        .toArray();
      
      console.log(`[api/board GET] Debug - found ${allTasks.length} total tasks in DB. ProjectIds:`, 
        allTasks.map(t => ({ id: t._id.toString().slice(-8), projectId: t.projectId, projectIdType: typeof t.projectId })));
    }

    // Fetch columns for this specific project  
    let columns = await database
      .collection("columns")
      .find({ projectId: projectId })
      .sort({ order: 1 })
      .toArray();
    
    console.log(`[api/board GET] Found ${columns.length} columns for project ${projectId} with string projectId`);
    
    // If no columns found with string projectId, try with customDbProjectId (for consistency)
    if (columns.length === 0 && tasks.length > 0) {
      // If we found tasks with customDbProjectId, try to find columns the same way
      const projectDocRef = doc(db, "projects", projectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const customDbProjectId = projectData.customDbProjectId;
        
        if (customDbProjectId) {
          console.log(`[api/board GET] Trying to find columns with customDbProjectId: ${customDbProjectId}`);
          columns = await database
            .collection("columns")
            .find({ projectId: customDbProjectId })
            .sort({ order: 1 })
            .toArray();
          console.log(`[api/board GET] Found ${columns.length} columns with customDbProjectId`);
        }
      }
    }

    // Format tasks for the board
    const formattedTasks = tasks.map((task: any) => ({
      ...task,
      id: task._id.toString(),
      _id: undefined,
      columnId: task.columnId || task.status || 'todo', // Add default columnId
    }));

    // Group tasks by columnId for the board structure
    const board: Record<string, { tasks: any[] }> = {};
    
    formattedTasks.forEach(task => {
      const columnId = task.columnId || 'todo';
      if (!board[columnId]) {
        board[columnId] = { tasks: [] };
      }
      board[columnId].tasks.push(task);
    });
    
    return NextResponse.json({
      board,
      columns: columns.map(col => ({ ...col, id: col._id.toString(), _id: undefined })), // Return fetched and formatted columns
    });

  } catch (error) {
    console.error("Error fetching board data:", error);
    return NextResponse.json(
      { error: "Failed to fetch board data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const taskData = await request.json();
    
    console.log("=== CREATING TASK ===");
    console.log("Project ID:", projectId);
    console.log("Task data:", taskData);

    // Get userId from query params or taskData
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || taskData.userId;
    const organizationId = searchParams.get('organizationId') || taskData.organizationId; // Extract organizationId

    console.log(`[api/board POST] Creating task for project ${projectId}, user ${userId}, org ${organizationId}`);
    console.log("[api/board POST] Task data:", taskData);

    // Get the correct MongoDB project ID for database operations
    const mongoProjectId = await getMongoProjectId(projectId);
    console.log(`[api/board POST] Using mongoProjectId: ${mongoProjectId} for database operations`);

    // Pass organizationId to getDatabaseForProject
    const database = await getDatabaseForProject(projectId, { userId: userId || undefined, organizationId: organizationId || undefined });
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Validate required fields
    if (!taskData.title || !taskData.columnId) {
      return NextResponse.json(
        { error: "Title and column ID are required" },
        { status: 400 }
      );
    }

    // Get the highest order for the column to append at the end
    const existingTasks = await database
      .collection("tasks")
      .find({ projectId: mongoProjectId, columnId: taskData.columnId })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const nextOrder = existingTasks.length > 0 ? (existingTasks[0].order || 0) + 1 : 0;

    // Create the task document
    const newTask = {
      title: taskData.title,
      description: taskData.description || "",
      projectId: mongoProjectId, // Use MongoDB project ID
      columnId: taskData.columnId,
      priority: taskData.priority || "medium",
      status: taskData.status || "todo",
      order: nextOrder,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Inserting task:", newTask);

    // Insert the task
    const result = await database.collection("tasks").insertOne(newTask);

    // Return the created task with proper ID format
    const createdTask = {
      ...newTask,
      id: result.insertedId.toString(),
      _id: undefined,
      dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
    };

    console.log("Task created successfully:", createdTask);

    return NextResponse.json(createdTask, { status: 201 });

  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
