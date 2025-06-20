import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Deleting profile image for user: ${userId}`);

    // Remove the image data from Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      photoURL: null,
      photoContentType: null,
      updatedAt: serverTimestamp(),
    });

    console.log(`Profile image deleted successfully for ${userId}`);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting profile image:", error);
    return NextResponse.json(
      { error: "Failed to delete profile image" },
      { status: 500 }
    );
  }
}
