// app/api/github/auth/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function POST(request: NextRequest) {
  try {
    const { code, userId, context, projectId, organizationId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Code and user ID are required" },
        { status: 400 }
      );
    }

    // Use the appropriate GitHub credentials based on context
    let clientId: string | undefined;
    let clientSecret: string | undefined;

    if (context === 'project' || context === 'organization') {
      // Use organization GitHub app credentials for project/organization contexts
      clientId = process.env.NEXT_PUBLIC_ORG_GITHUB_CLIENT_ID;
      clientSecret = process.env.GITHUB_ORG_CLIENT_SECRET;
    } else {
      // Use personal GitHub app credentials for personal context
      clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      clientSecret = process.env.GITHUB_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: `GitHub configuration missing for ${context} context` },
        { status: 500 }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      // Provide more specific error messages for common issues
      let errorMessage = tokenData.error_description || tokenData.error;
      
      if (tokenData.error === "bad_verification_code" || 
          tokenData.error === "incorrect_client_credentials") {
        errorMessage = "The authorization code has expired or is invalid. Please try connecting again.";
      } else if (tokenData.error === "access_denied") {
        errorMessage = "GitHub access was denied. Please try connecting again and grant the necessary permissions.";
      }
      
      throw new Error(errorMessage);
    }

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Create a context-specific token identifier
    let tokenId = userId; // Default for personal context
    if (context === 'project' && projectId) {
      tokenId = `${userId}_project_${projectId}`;
    } else if (context === 'organization' && organizationId) {
      tokenId = `${userId}_org_${organizationId}`;
    }

    // Store token in database with context information
    const tokenDocument = {
      tokenId,
      userId,
      context: context || 'personal', // 'personal', 'project', or 'organization'
      projectId: projectId || null,
      organizationId: organizationId || null,
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("githubTokens").replaceOne(
      { tokenId },
      tokenDocument,
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error exchanging GitHub token:", error);
    return NextResponse.json(
      { 
        error: "Failed to exchange token",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
