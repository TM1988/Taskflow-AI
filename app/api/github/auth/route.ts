// app/api/github/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

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

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Remove GitHub token
    await adminDb.collection("githubTokens").deleteOne({ userId });

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
