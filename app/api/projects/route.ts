import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🔄 [${requestId}] Projects API GET called`);
  
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    console.log(`🔍 [${requestId}] Request details:`);
    console.log(`  - URL: ${request.url}`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - All search params: ${searchParams.toString()}`);
    console.log(`  - Environment check:`);
    console.log(`    - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`    - MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
    console.log(`    - MONGODB_URI length: ${process.env.MONGODB_URI?.length || 0}`);

    if (!userId) {
      console.error(`❌ [${requestId}] Missing userId parameter`);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    console.log(`🔄 [${requestId}] Calling getAdminDb()...`);
    const adminDb = await getAdminDb();

    if (!adminDb) {
      console.error(`❌ [${requestId}] getAdminDb() returned null/undefined`);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    console.log(`✅ [${requestId}] Database connected successfully`);
    console.log(`  - Database name: ${adminDb.databaseName}`);
    
    console.log(`🔍 [${requestId}] Building MongoDB query...`);
    const query = {
      $or: [
        { ownerId: userId },
        { members: { $in: [userId] } }
      ]
    };
    console.log(`  - Query: ${JSON.stringify(query, null, 2)}`);

    console.log(`🔄 [${requestId}] Executing MongoDB query...`);
    
    // Get projects where user is owner or member
    const projects = await adminDb
      .collection("projects")
      .find(query)
      .toArray();

    console.log(`✅ [${requestId}] Query executed successfully`);
    console.log(`  - Projects found: ${projects.length}`);
    console.log(`  - Project IDs: ${projects.map(p => p._id.toString()).join(', ')}`);

    const transformedProjects = projects.map(project => ({
      id: project._id.toString(),
      ...project,
      _id: undefined,
    }));

    console.log(`✅ [${requestId}] Returning ${transformedProjects.length} projects`);
    return NextResponse.json(transformedProjects);
  } catch (error: unknown) {
    // Cast error to a type that has the properties we need
    const err = error as Error;
    
    console.error(`❌ [${requestId}] Error in projects API:`);
    console.error(`  - Error type: ${err?.constructor?.name}`);
    console.error(`  - Error message: ${err?.message}`);
    console.error(`  - Error code: ${(err as any)?.code}`);
    console.error(`  - Error stack: ${err?.stack}`);
    console.error(`  - MongoDB connection details:`);
    console.error(`    - MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
    console.error(`    - MONGODB_URI starts with: ${process.env.MONGODB_URI?.substring(0, 20)}...`);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch projects",
        details: err?.message || 'Unknown error',
        requestId 
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const adminDb = await getAdminDb();

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    const projectData = {
      ...data,
      members: data.members || [data.ownerId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await adminDb.collection("projects").insertOne(projectData);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...projectData,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating project:", err);
    return NextResponse.json(
      { error: "Failed to create project", details: err?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
