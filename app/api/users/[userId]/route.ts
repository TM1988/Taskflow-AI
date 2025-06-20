import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // First, try to get user data from Firestore users collection
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return NextResponse.json({
        id: userId,
        displayName: userData.displayName || userData.name,
        email: userData.email,
        photoURL: userData.photoURL || userData.avatar,
        createdAt: userData.createdAt,
      });
    }

    // If not found in users collection, return basic info
    return NextResponse.json({
      id: userId,
      displayName: "Team Member",
      email: "member@example.com",
      photoURL: null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
