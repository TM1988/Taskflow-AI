// app/api/github/auth/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { githubServiceServer } from "@/services/github/githubServiceServer";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    console.log("Token exchange request received");

    const data = await request.json();
    const { code, userId } = data;

    console.log("Processing code exchange for userId:", userId);

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Both code and userId are required" },
        { status: 400 },
      );
    }

    // Exchange code for token
    const accessToken = await githubServiceServer.exchangeCodeForToken(code);
    console.log("Access token obtained successfully");

    // Store token using Admin SDK (bypasses security rules)
    try {
      await adminDb.collection("githubTokens").doc(userId).set({
        accessToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("GitHub token stored successfully via Admin SDK");
    } catch (adminError) {
      console.error("Error using Admin SDK:", adminError);
      return NextResponse.json(
        { error: "Admin SDK error", details: String(adminError) },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in token exchange:", error);
    return NextResponse.json(
      { error: "Failed to exchange code for token", details: String(error) },
      { status: 500 },
    );
  }
}
