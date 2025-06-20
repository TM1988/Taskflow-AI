// app/api/columns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

// Helper function to get the correct project ID for database operations
async function getMongoProjectId(firebaseProjectId: string): Promise<string> {
  try {
    // Check if this is a Firebase ID that has a corresponding MongoDB ID
    if (firebaseProjectId.length < 25) { // Firebase IDs are shorter than MongoDB ObjectIds
      console.log(`[Columns getMongoProjectId] Project ID ${firebaseProjectId} looks like Firebase ID, checking for MongoDB mapping...`);
      const projectDocRef = doc(db, "projects", firebaseProjectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        if (projectData.customDbProjectId) {
          console.log(`[Columns getMongoProjectId] Found MongoDB project ID: ${projectData.customDbProjectId} for Firebase ID: ${firebaseProjectId}`);
          return projectData.customDbProjectId;
        }
      }
    }
    
    // If no mapping found, return the original ID
    console.log(`[Columns getMongoProjectId] Using original project ID: ${firebaseProjectId}`);
    return firebaseProjectId;
  } catch (error) {
    console.log(`[Columns getMongoProjectId] Error checking Firebase mapping:`, error);
    return firebaseProjectId;
  }
}

// Helper function to get the database connection based on project organization
async function getDatabaseForProject(projectId: string, options: { userId?: string, organizationId?: string }) {
  const { userId, organizationId: directOrganizationId } = options;
  try {
    console.log(`[getDatabaseForProject - Columns] Project: ${projectId}, UserID: ${userId}, DirectOrgID: ${directOrganizationId}`);

    if (directOrganizationId) {
      console.log(`[getDatabaseForProject - Columns] Using directOrganizationId: ${directOrganizationId} for project ${projectId}.`);
      return await getOrganizationDatabaseConnection(directOrganizationId);
    }

    // If no directOrganizationId, try Firestore lookup
    console.log(`[getDatabaseForProject - Columns] No directOrganizationId. Fetching project ${projectId} from Firestore to find its organization.`);
    const projectDocRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      const project = projectDoc.data();
      console.log(`[getDatabaseForProject - Columns] Project ${projectId} found in Firestore. Data:`, JSON.stringify(project, null, 2));
      if (project.organizationId) {
        console.log(`[getDatabaseForProject - Columns] Project ${projectId} has organizationId: ${project.organizationId} from Firestore. Using organization database.`);
        return await getOrganizationDatabaseConnection(project.organizationId);
      }
    } else {
      console.log(`[getDatabaseForProject - Columns] Project ${projectId} not found in Firestore.`);
    }

    // Fallbacks if organizationId couldn't be determined
    if (userId) {
      console.log(`[getDatabaseForProject - Columns] Falling back to user database for userId: ${userId} (project ${projectId}).`);
      return await getUserDatabaseConnection(userId);
    } else {
      console.warn(`[getDatabaseForProject - Columns] No userId provided for fallback, and project ${projectId} could not be associated with an organization. Falling back to admin database.`);
      return await getAdminDb();
    }
  } catch (error) {
    console.error(`[getDatabaseForProject - Columns] Error determining database for project ${projectId}:`, error);
    console.warn(`[getDatabaseForProject - Columns] Falling back to admin database due to an error for project ${projectId}.`);
    return await getAdminDb(); // Fallback on error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId"); // Extract organizationId

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    console.log(`[api/columns GET] Fetching columns for project ${projectId}, user ${userId}, org ${organizationId}`);
    
    // Get the correct MongoDB project ID for database operations
    const mongoProjectId = await getMongoProjectId(projectId);
    console.log(`[api/columns GET] Using mongoProjectId: ${mongoProjectId} for database operations`);
    
    const database = await getDatabaseForProject(projectId, { userId: userId || undefined, organizationId: organizationId || undefined });
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }
    
    const columns = await database
      .collection("columns")
      .find({ projectId: mongoProjectId })
      .sort({ order: 1 })
      .toArray();

    console.log(`Found ${columns.length} columns for project ${projectId}`);

    // Convert ObjectId to string
    const formattedColumns = columns.map(col => ({
      ...col,
      id: col._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(formattedColumns);
  } catch (error) {
    console.error("Error fetching columns:", error);
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Destructure organizationId from body
    const { projectId, name, order, createDefaults, userId, organizationId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    console.log(`[api/columns POST] Action for project ${projectId}, user ${userId}, org ${organizationId}`);
    console.log("[api/columns POST] Body:", body);

    // Pass organizationId to getDatabaseForProject
    // If createDefaults is true, and organizationId is present, it will use the org DB.
    // If it's a personal project, organizationId will be undefined, and it will fall back to user/admin DB.
    const database = await getDatabaseForProject(projectId, { userId: userId || undefined, organizationId: organizationId || undefined });
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }
    
    // If createDefaults is true, create all default columns atomically
    if (createDefaults) {
      console.log(`[api/columns POST] Creating default columns for project: ${projectId}, org: ${organizationId}`);
      
      // Get the correct MongoDB project ID for database operations
      const mongoProjectId = await getMongoProjectId(projectId);
      console.log(`[api/columns POST] Using mongoProjectId: ${mongoProjectId} for database operations`);
      
      // First check if columns already exist (using MongoDB project ID)
      const existingColumns = await database
        .collection("columns")
        .find({ projectId: mongoProjectId })
        .toArray();
      
      if (existingColumns.length > 0) {
        console.log("Columns already exist, returning existing:", existingColumns.length);
        const formattedColumns = existingColumns
          .map((col: any) => ({
            ...col,
            id: col._id.toString(),
            _id: undefined
          }))
          .sort((a: any, b: any) => a.order - b.order);
        
        return NextResponse.json({ columns: formattedColumns }, { status: 200 });
      }
      
      // Create default columns (using MongoDB project ID)
      const defaultColumnsData = [
        { projectId: mongoProjectId, name: "To Do", order: 0, createdAt: new Date(), updatedAt: new Date(), organizationId: organizationId || null },
        { projectId: mongoProjectId, name: "In Progress", order: 1, createdAt: new Date(), updatedAt: new Date(), organizationId: organizationId || null },
        { projectId: mongoProjectId, name: "Review", order: 2, createdAt: new Date(), updatedAt: new Date(), organizationId: organizationId || null },
        { projectId: mongoProjectId, name: "Done", order: 3, createdAt: new Date(), updatedAt: new Date(), organizationId: organizationId || null },
      ];

      // Filter out organizationId if it's null before inserting
      const columnsToInsert = defaultColumnsData.map(col => {
        const { organizationId, ...rest } = col;
        if (col.organizationId) {
          return { ...rest, organizationId: col.organizationId };
        }
        return rest;
      });

      const result = await database.collection("columns").insertMany(columnsToInsert);
      
      const columns = defaultColumnsData.map((col, index) => ({
        ...col,
        id: result.insertedIds[index].toString()
      }));

      console.log("Created default columns:", columns.length);
      return NextResponse.json({ columns }, { status: 201 });
    }

    // Single column creation
    if (!name) {
      return NextResponse.json({ error: "Column name is required" }, { status: 400 });
    }

    const newColumnData = {
      projectId,
      name,
      order: order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: organizationId || null // Add organizationId if present
    };

    // Filter out organizationId if it's null before inserting
    const columnToInsert = (({ organizationId, ...rest }) => organizationId ? { ...rest, organizationId } : rest)(newColumnData);

    const result = await database.collection("columns").insertOne(columnToInsert);
    
    const column = {
      ...newColumnData,
      id: result.insertedId.toString()
    };

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Destructure organizationId from body
    const { columns, userId, organizationId, projectId } = body; // Added projectId

    if (!columns || !Array.isArray(columns)) {
      return NextResponse.json({ error: "Columns array is required" }, { status: 400 });
    }
    if (!projectId) { // Added check for projectId
      return NextResponse.json({ error: "Project ID is required for updating columns" }, { status: 400 });
    }

    console.log(`[api/columns PUT] Updating columns for project ${projectId}, user ${userId}, org ${organizationId}`);

    // Pass organizationId to getDatabaseForProject
    const database = await getDatabaseForProject(projectId, { userId: userId || undefined, organizationId: organizationId || undefined });
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }
    
    // Update multiple columns
    const bulkOps = columns.map((col: any) => ({
      updateOne: {
        filter: { _id: new ObjectId(col.id) },
        update: {
          $set: {
            name: col.name,
            order: col.order,
            updatedAt: new Date()
          }
        }
      }
    }));

    await database.collection("columns").bulkWrite(bulkOps);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating columns:", error);
    return NextResponse.json({ error: "Failed to update columns" }, { status: 500 });
  }
}
