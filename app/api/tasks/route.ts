import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getAdminDb, getOrganizationDatabaseConnection } from "@/services/db/dynamicConnection"; // Added getOrganizationDatabaseConnection
import { ObjectId } from "mongodb";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

// Helper function to get the correct project ID for database operations
async function getMongoProjectId(firebaseProjectId: string): Promise<string> {
  try {
    // Check if this is a Firebase ID that has a corresponding MongoDB ID
    if (firebaseProjectId.length < 25) { // Firebase IDs are shorter than MongoDB ObjectIds
      console.log(`[Tasks getMongoProjectId] Project ID ${firebaseProjectId} looks like Firebase ID, checking for MongoDB mapping...`);
      const projectDocRef = doc(db, "projects", firebaseProjectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        if (projectData.customDbProjectId) {
          console.log(`[Tasks getMongoProjectId] Found MongoDB project ID: ${projectData.customDbProjectId} for Firebase ID: ${firebaseProjectId}`);
          return projectData.customDbProjectId;
        }
      }
    }
    
    // If no mapping found, return the original ID
    console.log(`[Tasks getMongoProjectId] Using original project ID: ${firebaseProjectId}`);
    return firebaseProjectId;
  } catch (error) {
    console.log(`[Tasks getMongoProjectId] Error checking Firebase mapping:`, error);
    return firebaseProjectId;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const columnId = searchParams.get("columnId");
  const userId = searchParams.get("userId"); // User ID for personal tasks or to check user-specific config for non-org tasks
  const organizationId = searchParams.get("organizationId"); // Organization ID for project tasks
  const personal = searchParams.get("personal");
  const limit = searchParams.get("limit"); // Support for limiting results

  // Handle personal tasks
  if (personal === "true" && userId) {
    try {
      // For personal tasks, always use user-specific database connection
      const database = await getUserDatabaseConnection(userId);
      if (!database) {
        return NextResponse.json(
          { error: "Database connection failed for personal tasks" },
          { status: 500 },
        );
      }

      // Build query
      let query = database
        .collection("personalTasks")
        .find({ userId })
        .sort({ updatedAt: -1, order: 1 });

      // Apply limit if specified
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          query = query.limit(limitNum);
        }
      }

      const tasks = await query.toArray();

      // Transform to expected format
      const transformedTasks = tasks?.map(task => ({
        id: task._id.toString(),
        title: task.title,
        description: task.description || "",
        projectId: "personal", // Explicitly set for personal tasks
        columnId: task.columnId || "todo",
        status: task.status || "todo",
        priority: task.priority || "medium",
        order: task.order || 0,
        isBlocked: task.isBlocked || false,
        tags: task.tags || [],
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        createdAt: task.createdAt ? task.createdAt.toISOString() : null,
        updatedAt: task.updatedAt ? task.updatedAt.toISOString() : null,
      })) || [];

      return NextResponse.json(transformedTasks);
    } catch (error) {
      console.error("Error fetching personal tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch personal tasks" },
        { status: 500 },
      );
    }
  }

  // Handle project tasks (non-personal)
  if (!projectId && !columnId && !organizationId) { // if no orgId, then projectId or columnId is required
    return NextResponse.json(
      { error: "Project ID, Column ID, or Organization ID is required for non-personal tasks" },
      { status: 400 },
    );
  }
  if (organizationId && !projectId) { // if orgId is present, projectId should also be present for fetching specific project tasks
    // This case could be adjusted if you want to fetch ALL tasks for an org, but typically you fetch for a project.
    // return NextResponse.json(
    //   { error: "Project ID is required when Organization ID is provided" },
    //   { status: 400 },
    // );
     // For now, let's allow fetching all tasks for an org if only orgId is given, though this might be too broad.
  }

  try {
    let database;
    if (organizationId) {
      console.log(`Fetching tasks for organization: ${organizationId}, project: ${projectId || 'ALL'}`);
      database = await getOrganizationDatabaseConnection(organizationId);
    } else if (userId) {
      console.warn(`Fetching project tasks using user-specific DB for user: ${userId}, project: ${projectId}. Consider passing organizationId.`);
      database = await getUserDatabaseConnection(userId);
    } else {
      console.log(`Fetching tasks using admin/official DB for project: ${projectId}`);
      database = await getAdminDb(); 
    }
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed for project tasks" },
        { status: 500 },
      );
    }

    let tasks;
    const query: any = {};
    if (projectId) query.projectId = projectId; 
    if (columnId) query.columnId = columnId; 

    // If only organizationId is provided, and not projectId, this will fetch all tasks 
    // for that org's DB. If projectId is also there, it filters by that project.
    // If neither, it might fetch all tasks in the DB if query is empty (dangerous).
    // The initial check for projectId || columnId || organizationId prevents a completely empty query.

    console.log("Querying tasks with:", query, `in DB for org: ${organizationId || 'N/A'}`);

    tasks = await database
      .collection("tasks") 
      .find(query)
      .sort({ order: 1 })
      .toArray();

    const transformedTasks = tasks?.map(task => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      projectId: task.projectId, 
      columnId: task.columnId, 
      status: task.status,
      priority: task.priority,
      order: task.order,
      isBlocked: task.isBlocked,
      tags: task.tags || [],
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
    })) || [];

    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch project tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, organizationId, projectId } = data;

    console.log("[Tasks API POST] Received task creation request:", {
      userId,
      organizationId,
      projectId,
      title: data.title,
      personal: data.personal
    });

    // Handle personal task creation
    if (projectId === "personal" && userId) {
      console.log("[Tasks API POST] Creating personal task for user:", userId);
      let personalDb;
      try {
        personalDb = await getUserDatabaseConnection(userId);
        if (!personalDb) throw new Error("Personal database connection failed");

        console.log("[Tasks API POST] Connected to personal database successfully");

        const taskData = {
          title: data.title,
          description: data.description || "",
          userId: userId, 
          columnId: data.columnId || "todo",
          status: data.status || "todo",
          priority: data.priority || "medium",
          order: data.order || 0,
          isBlocked: data.isBlocked || false,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          tags: data.tags || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log("[Tasks API POST] Inserting personal task into personalTasks collection:", taskData);
        const result = await personalDb.collection("personalTasks").insertOne(taskData);
        console.log("[Tasks API POST] Personal task created with ID:", result.insertedId.toString());

        return NextResponse.json({
          id: result.insertedId.toString(),
          ...taskData, 
          projectId: "personal",
          createdAt: taskData.createdAt.toISOString(),
          updatedAt: taskData.updatedAt.toISOString(),
        }, { status: 201 });

      } catch (error) {
        console.error("Error creating personal task:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          { error: `Failed to create personal task: ${message}` },
          { status: 500 },
        );
      }
    }

    // Handle regular project task creation
    if (!organizationId || !projectId) {
      return NextResponse.json(
        { error: "Organization ID and Project ID are required for project tasks" },
        { status: 400 },
      );
    }

    let projectDb;
    try {
      console.log(`Creating task for organization: ${organizationId}, project: ${projectId}`);
      
      // Get the correct MongoDB project ID for database operations
      const mongoProjectId = await getMongoProjectId(projectId);
      console.log(`[Tasks POST] Using mongoProjectId: ${mongoProjectId} for database operations`);
      
      projectDb = await getOrganizationDatabaseConnection(organizationId);
      if (!projectDb) throw new Error("Organization database connection failed");

      const taskData = {
        title: data.title,
        description: data.description || "",
        projectId: mongoProjectId, // Use MongoDB project ID
        columnId: data.columnId, 
        status: data.status || "todo",
        priority: data.priority || "medium",
        order: data.order || 0,
        isBlocked: data.isBlocked || false,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(data.assignee && { assignee: data.assignee }),
        ...(data.tags && { tags: data.tags }),
      };

      const result = await projectDb.collection("tasks").insertOne(taskData);
      console.log("Task created successfully in org DB:", result.insertedId);
      return NextResponse.json({
        id: result.insertedId.toString(),
        ...taskData, 
        createdAt: taskData.createdAt.toISOString(),
        updatedAt: taskData.updatedAt.toISOString(),
      }, { status: 201 });

    } catch (error) {
      console.error("Error creating project task:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to create project task: ${message}` },
        { status: 500 },
      );
    }

  } catch (error) {
    console.error("Error processing POST request for task:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Invalid request payload or internal server error: ${message}` },
      { status: 500 },
    );
  }
}

// TODO: Implement PUT and DELETE handlers similarly, ensuring they use
// getOrganizationDatabaseConnection for project tasks and getUserDatabaseConnection for personal tasks.
// Remember to pass organizationId from the client for project-related operations.
