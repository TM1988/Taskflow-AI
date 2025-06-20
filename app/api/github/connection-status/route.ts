import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    console.log(`🔄 [${requestId}] Getting admin database...`);
    const adminDb = await getAdminDb();

    if (!adminDb) {
      console.error(`❌ [${requestId}] MongoDB connection failed - adminDb is null/undefined`);
      throw new Error("MongoDB connection failed");
    }

    // Create context-specific token identifier
    let tokenId = userId; // Default for personal context
    if (context === 'project' && projectId) {
      tokenId = `${userId}_project_${projectId}`;
    } else if (context === 'organization' && organizationId) {
      tokenId = `${userId}_org_${organizationId}`;
    }

    const tokenDoc = await adminDb.collection("githubTokens").findOne({ tokenId });
    
    const result = {
      isConnected: !!tokenDoc,
      context: tokenDoc?.context || null
    };
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    
    console.error(`❌ [${requestId}] GitHub connection-status error:`, err?.message);
    
    return NextResponse.json(
      { 
        isConnected: false,
        error: err?.message || 'Unknown error',
        requestId 
      },
      { status: 200 }
    );
  }
}
