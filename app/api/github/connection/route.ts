import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const context = searchParams.get("context") || "personal";
    const projectId = searchParams.get("projectId");
    const organizationId = searchParams.get("organizationId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    if (!db) {
      throw new Error("MongoDB connection failed");
    }

    // Create context-specific token identifier
    let tokenId = userId; // Default for personal context
    if (context === 'project' && projectId) {
      tokenId = `${userId}_project_${projectId}`;
    } else if (context === 'organization' && organizationId) {
      tokenId = `${userId}_org_${organizationId}`;
    }

    // Check for GitHub token
    const tokenDoc = await db.collection("githubTokens").findOne({ tokenId });

    const isConnected = !!(tokenDoc && tokenDoc.accessToken);

    return NextResponse.json({
      isConnected,
      context,
      tokenId
    });

  } catch (error: unknown) {
    const err = error as Error;
    
    return NextResponse.json(
      {
        error: "Failed to check GitHub connection",
        details: err?.message || 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  }
}
