import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { userId, imageData, contentType } = await request.json();

    if (!userId || !imageData) {
      return NextResponse.json(
        { error: "User ID and image data are required" },
        { status: 400 }
      );
    }

    console.log(`Saving profile image for user: ${userId}`);

    // Save the base64 image data directly to Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      photoURL: imageData, // Store base64 directly
      photoContentType: contentType,
      updatedAt: serverTimestamp(),
    });

    console.log(`Profile image saved successfully for ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: imageData // Return the base64 string as the URL
    });

  } catch (error) {
    console.error("Error saving profile image:", error);
    return NextResponse.json(
      { error: "Failed to save profile image" },
      { status: 500 }
    );
  }
}
