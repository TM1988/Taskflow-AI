import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "userIds must be an array" },
        { status: 400 }
      );
    }

    const users: any[] = [];

    // Fetch user data for each ID
    for (const userId of userIds) {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          users.push({
            id: userId,
            displayName: userData.displayName || userData.name,
            email: userData.email,
            photoURL: userData.photoURL || userData.avatar,
            createdAt: userData.createdAt,
          });
        } else {
          // If user not found in Firestore, try to get basic info from Firebase Auth
          // For now, add placeholder with userId-based info
          users.push({
            id: userId,
            displayName: `User ${userId.slice(0, 8)}`, // Show part of userId
            email: "member@example.com",
            photoURL: null,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        // Add a placeholder for failed fetches
        users.push({
          id: userId,
          displayName: "Unknown User",
          email: "unknown@example.com",
          photoURL: null,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching batch user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
