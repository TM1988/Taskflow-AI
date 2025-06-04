import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(`🔄 [${requestId}] Projects API GET called`);
    console.log(`🔍 [${requestId}] Request details:`, {
      url: request.url,
      userId,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Initialize MongoDB with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let mongoDb;

    while (retryCount < maxRetries) {
      try {
        await initializeMongoDB();
        const dbResult = await getMongoDb();
        mongoDb = dbResult.mongoDb;
        break;
      } catch (error) {
        retryCount++;
        console.log(`⚠️ [${requestId}] MongoDB connection attempt ${retryCount} failed:`, error);
        
        if (retryCount === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    const query = {
      $or: [
        { ownerId: userId },
        { members: { $in: [userId] } }
      ]
    };

    console.log(`🔍 [${requestId}] Executing MongoDB query:`, JSON.stringify(query, null, 2));

    const projects = await mongoDb!.collection("projects").find(query).toArray();
    
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
    const { name, description, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Name and owner ID are required" },
        { status: 400 }
      );
    }

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    const newProject = {
      name,
      description: description || "",
      ownerId,
      members: [ownerId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await mongoDb.collection("projects").insertOne(newProject);

    const project = {
      ...newProject,
      id: result.insertedId.toString(),
      _id: undefined,
    };

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
