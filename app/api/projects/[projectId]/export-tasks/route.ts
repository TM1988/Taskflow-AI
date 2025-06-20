import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

// Helper function to get the database connection based on project organization (same as board API)
async function getDatabaseForProject(projectId: string, options: { userId?: string, organizationId?: string }) {
  const { userId, organizationId: directOrganizationId } = options;
  try {
    console.log(`[Export getDatabaseForProject] Project: ${projectId}, UserID: ${userId}, DirectOrgID: ${directOrganizationId}`);

    if (directOrganizationId) {
      console.log(`[Export getDatabaseForProject] Using directOrganizationId: ${directOrganizationId} for project ${projectId}.`);
      return await getOrganizationDatabaseConnection(directOrganizationId);
    }

    // If no directOrganizationId, try Firestore lookup
    console.log(`[Export getDatabaseForProject] No directOrganizationId. Fetching project ${projectId} from Firestore to find its organization.`);
    const projectDocRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      const project = projectDoc.data();
      console.log(`[Export getDatabaseForProject] Project ${projectId} found in Firestore. Data:`, JSON.stringify(project, null, 2));
      if (project.organizationId) {
        console.log(`[Export getDatabaseForProject] Project ${projectId} has organizationId: ${project.organizationId} from Firestore. Using organization database.`);
        return await getOrganizationDatabaseConnection(project.organizationId);
      } else {
        console.log(`[Export getDatabaseForProject] Project ${projectId} found in Firestore but has no organizationId.`);
      }
    } else {
      console.log(`[Export getDatabaseForProject] Project ${projectId} not found in Firestore.`);
    }

    // Fallbacks if organizationId couldn't be determined
    if (userId) {
      console.log(`[Export getDatabaseForProject] Falling back to user database for userId: ${userId} (project ${projectId}).`);
      return await getUserDatabaseConnection(userId);
    } else {
      console.warn(`[Export getDatabaseForProject] No userId provided for fallback, and project ${projectId} could not be associated with an organization. Falling back to admin database.`);
      return await getAdminDb();
    }
  } catch (error) {
    console.error(`[Export getDatabaseForProject] Error determining database for project ${projectId}:`, error);
    console.warn(`[Export getDatabaseForProject] Falling back to admin database due to an error for project ${projectId}.`);
    return await getAdminDb(); // Fallback on error
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    console.log("Export API: Exporting data for project:", projectId);

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get organization ID and user ID from search params
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const userId = url.searchParams.get("userId");

    console.log("Export API: Context - projectId:", projectId, "organizationId:", organizationId, "userId:", userId);

    // Get database connection using the same logic as board API
    const database = await getDatabaseForProject(projectId, { userId: userId || undefined, organizationId: organizationId || undefined });
    
    if (!database) {
      throw new Error("Database connection failed");
    }
    
    console.log("Export API: Successfully connected to database");
    
    // Try to find the MongoDB project ID (same logic as board API)
    let mongoProjectId = projectId;
    
    // Check if this is a Firebase ID that has a corresponding MongoDB ID
    if (projectId.length < 25) { // Firebase IDs are shorter than MongoDB ObjectIds
      console.log(`Export API: Project ID ${projectId} looks like Firebase ID, checking for MongoDB mapping...`);
      try {
        const projectDocRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectDocRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          if (projectData.customDbProjectId) {
            console.log(`Export API: Found MongoDB project ID: ${projectData.customDbProjectId} for Firebase ID: ${projectId}`);
            mongoProjectId = projectData.customDbProjectId;
          }
        }
      } catch (error) {
        console.log("Export API: Error checking Firebase mapping:", error);
      }
    }
    
    console.log(`Export API: Using mongoProjectId: ${mongoProjectId} for queries`);
    
    // Fetch columns for the project
    console.log(`Export API: Searching for columns with projectId: "${mongoProjectId}" (type: ${typeof mongoProjectId})`);
    
    const columnsSnapshot = await database
      .collection("columns")
      .find({ projectId: mongoProjectId })
      .sort({ order: 1 })
      .toArray();

    console.log(`Export API: Found ${columnsSnapshot.length} columns for project ${mongoProjectId}`);

    // If no columns found, let's debug by checking what projectIds exist
    if (columnsSnapshot.length === 0) {
      console.log("Export API: No columns found, checking what projectIds exist in columns collection...");
      const sampleColumns = await database
        .collection("columns")
        .find({})
        .limit(10)
        .toArray();
      console.log("Export API: Sample columns in database:", sampleColumns.map(col => ({ 
        id: col._id.toString().slice(-8), 
        name: col.name, 
        projectId: col.projectId, 
        projectIdType: typeof col.projectId 
      })));
    }

    const columns = columnsSnapshot.map((doc: any) => ({
      id: doc._id.toString(),
      name: doc.name,
      order: doc.order,
      projectId: doc.projectId,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    }));

    // Fetch tasks for the project
    console.log(`Export API: Searching for tasks with projectId: "${mongoProjectId}" (type: ${typeof mongoProjectId})`);
    
    let tasksSnapshot = await database
      .collection("tasks")
      .find({ projectId: mongoProjectId })
      .sort({ order: 1 })
      .toArray();

    console.log(`Export API: Found ${tasksSnapshot.length} tasks for project ${mongoProjectId} with MongoDB projectId`);

    // If no tasks found, let's debug by checking what projectIds exist
    if (tasksSnapshot.length === 0) {
      console.log("Export API: No tasks found, checking what projectIds exist in tasks collection...");
      const sampleTasks = await database
        .collection("tasks")
        .find({})
        .limit(10)
        .toArray();
      console.log("Export API: Sample tasks in database:", sampleTasks.map(task => ({ 
        id: task._id.toString().slice(-8), 
        title: task.title, 
        projectId: task.projectId, 
        projectIdType: typeof task.projectId 
      })));
    }

    const tasks = tasksSnapshot.map((doc: any) => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description || "",
      columnId: doc.columnId,
      status: doc.status || "todo",
      priority: doc.priority || "medium",
      order: doc.order || 0,
      isBlocked: doc.isBlocked || false,
      dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
      projectId: doc.projectId,
      userId: doc.userId,
      tags: doc.tags || [],
      assignedTo: doc.assignedTo || [],
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    }));

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        projectId,
        organizationId: organizationId || null,
        version: "1.0.0"
      },
      columns,
      tasks
    };

    console.log(`Export API: Successfully exported ${columns.length} columns and ${tasks.length} tasks`);

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Failed to export project data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
