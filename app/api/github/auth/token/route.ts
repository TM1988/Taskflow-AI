// app/api/github/auth/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Code and user ID are required" },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "GitHub configuration missing" },
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
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Store token in database
    await adminDb.collection("githubTokens").replaceOne(
      { userId },
      {
        userId,
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
