import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🔄 [${requestId}] GitHub repositories API called`);

  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    console.log(`🔍 [${requestId}] Request details:`);
    console.log(`  - URL: ${request.url}`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Search params: ${searchParams.toString()}`);

    if (!userId) {
      console.error(`❌ [${requestId}] Missing userId parameter`);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    console.log(`🔄 [${requestId}] Getting admin database...`);
    const adminDb = await getAdminDb();

    if (!adminDb) {
      console.error(`❌ [${requestId}] MongoDB connection failed`);
      throw new Error("MongoDB connection failed");
    }

    console.log(`✅ [${requestId}] Database connected, querying for GitHub token...`);

    // Get GitHub token
    const tokenDoc = await adminDb.collection("githubTokens").findOne({ userId });

    console.log(`🔍 [${requestId}] Token query result:`);
    console.log(`  - Token document found: ${!!tokenDoc}`);
    console.log(`  - Has access token: ${!!tokenDoc?.accessToken}`);

    if (!tokenDoc) {
      console.error(`❌ [${requestId}] No GitHub token found for user ${userId}`);
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 401 },
      );
    }

    console.log(`🔄 [${requestId}] Fetching repositories from GitHub API...`);

    // Fetch repositories from GitHub
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?per_page=100",
      {
        headers: {
          Authorization: `token ${tokenDoc.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TaskFlow-AI",
        },
      },
    );

    console.log(`🔍 [${requestId}] GitHub API response:`);
    console.log(`  - Status: ${reposResponse.status}`);
    console.log(`  - Status text: ${reposResponse.statusText}`);
    console.log(`  - Headers: ${JSON.stringify(Object.fromEntries(reposResponse.headers.entries()), null, 2)}`);

    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error(`❌ [${requestId}] GitHub API error:`);
      console.error(`  - Status: ${reposResponse.status}`);
      console.error(`  - Response: ${errorText}`);
      throw new Error(`GitHub API error: ${reposResponse.status} - ${errorText}`);
    }

    const repositories = await reposResponse.json();
    console.log(`✅ [${requestId}] Successfully fetched ${repositories.length} repositories`);

    return NextResponse.json(repositories);
  } catch (error: unknown) {
    // Cast error to a type that has the properties we need
    const err = error as Error;
    
    console.error(`❌ [${requestId}] Error in GitHub repositories API:`);
    console.error(`  - Error type: ${err?.constructor?.name}`);
    console.error(`  - Error message: ${err?.message}`);
    console.error(`  - Error code: ${(err as any)?.code}`);
    console.error(`  - Error stack: ${err?.stack}`);
    console.error(`  - MongoDB URI exists: ${!!process.env.MONGODB_URI}`);

    return NextResponse.json(
      {
        error: "Failed to fetch repositories",
        details: err?.message || 'Unknown error',
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, projectId, fullName } = await request.json();

    if (!userId || !projectId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Connect repository to project
    await adminDb.collection("projectRepositories").replaceOne(
      { userId, projectId, fullName },
      {
        userId,
        projectId,
        fullName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error connecting repository:", err);
    return NextResponse.json(
      { error: "Failed to connect repository", details: err?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
