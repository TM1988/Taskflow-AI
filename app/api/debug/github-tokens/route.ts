import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function GET(request: NextRequest) {
  try {
    // Get all GitHub tokens for debugging
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    const tokens = await adminDb.collection("githubTokens").find({}).toArray();
    
    return NextResponse.json({
      tokens: tokens.map(token => ({
        tokenId: token.tokenId,
        context: token.context,
        organizationId: token.organizationId,
        projectId: token.projectId,
        hasAccessToken: !!token.accessToken,
        createdAt: token.createdAt
      }))
    });
  } catch (error) {
    console.error("🔍 Debug: Error fetching GitHub tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub tokens" },
      { status: 500 }
    );
  }
}
