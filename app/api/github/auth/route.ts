// app/api/github/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE request to disconnect GitHub received");

    const data = await request.json();
    const { userId, context, projectId, organizationId } = data;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Create context-specific token identifier
    let tokenId = userId; // Default for personal context
    if (context === 'project' && projectId) {
      tokenId = `${userId}_project_${projectId}`;
    } else if (context === 'organization' && organizationId) {
      tokenId = `${userId}_org_${organizationId}`;
    }

    console.log(`Deleting GitHub token for tokenId ${tokenId} (context: ${context || 'personal'})`);

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Remove GitHub token
    await adminDb.collection("githubTokens").deleteOne({ tokenId });

    console.log("GitHub token deleted successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing GitHub token:", error);
    return NextResponse.json(
      { error: "Failed to disconnect GitHub", details: String(error) },
      { status: 500 },
    );
  }
}
