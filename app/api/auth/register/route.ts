import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName, photoURL } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    console.log(`Creating/updating user profile for ${uid}`);

    // Create user document in Firestore
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        email,
        displayName: displayName || null,
        photoURL: photoURL || null, // This can now be a Supabase URL
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`User profile created/updated for ${uid}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user profile:", error);
    return NextResponse.json(
      { error: "Failed to create user profile" },
      { status: 500 }
    );
  }
}
