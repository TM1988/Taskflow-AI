// app/api/github/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE request to disconnect GitHub received");

    const data = await request.json();
    const { userId } = data;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    console.log(`Deleting GitHub token for user ${userId}`);

    // Delete using Admin SDK
    await adminDb.collection("githubTokens").doc(userId).delete();

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
