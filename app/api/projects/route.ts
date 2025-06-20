import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");

    console.log(`🔄 [${requestId}] Projects API GET called`);
    console.log(`🔍 [${requestId}] Request details:`, {
      url: request.url,
      userId,
      organizationId,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Use appropriate database based on context
    let database;
    if (organizationId) {
      console.log(`🏢 [${requestId}] Using organization database for projects: ${organizationId}`);
      database = await getOrganizationDatabaseConnection(organizationId);
    } else {
      console.log(`👤 [${requestId}] Using user database for projects: ${userId}`);
      database = await getUserDatabaseConnection(userId);
    }

    if (!database) {
      throw new Error("Database connection failed");
    }

    const query: any = {
      $or: [
        { ownerId: userId },
        { members: { $in: [userId] } }
      ]
    };

    // Add organization filter if specified
    if (organizationId) {
      query.organizationId = organizationId;
    }

    console.log(`🔍 [${requestId}] Executing MongoDB query:`, JSON.stringify(query, null, 2));

    const projects = await database.collection("projects").find(query).toArray();
    
    console.log(`✅ [${requestId}] Found ${projects.length} projects`);

    // Format projects for response
    const formattedProjects = projects.map((project: any) => ({
      ...project,
      id: project._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(formattedProjects);

  } catch (error) {
    console.error(`❌ [${requestId}] Error in projects API:`, {
      type: (error as Error).constructor.name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });

    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, ownerId, organizationId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Name and owner ID are required" },
        { status: 400 }
      );
    }

    console.log("Creating project:", { name, ownerId, organizationId });

    // Use organization database if organizationId is provided
    let database;
    if (organizationId) {
      console.log("Using organization database for project creation:", organizationId);
      database = await getOrganizationDatabaseConnection(organizationId);
    } else {
      console.log("Using user database for project creation:", ownerId);
      database = await getUserDatabaseConnection(ownerId);
    }

    if (!database) {
      throw new Error("Database connection failed");
    }

    const newProject = {
      name,
      description: description || "",
      ownerId,
      members: [ownerId],
      organizationId: organizationId || null, // Store organizationId if provided
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection("projects").insertOne(newProject);

    const project = {
      ...newProject,
      id: result.insertedId.toString(),
      _id: undefined,
    };

    console.log("Project created successfully:", project.id, "in", organizationId ? "organization DB" : "user DB");

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
