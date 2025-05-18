// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Filter out sensitive information
    const userData = userDoc.data();
    const safeUserData = {
      id: userDoc.id,
      displayName: userData?.displayName,
      email: userData?.email,
      photoURL: userData?.photoURL,
      createdAt: userData?.createdAt,
    };

    return NextResponse.json(safeUserData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
