import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { GoogleAiService } from "@/services/ai/googleAiService";

// Function to verify API key is valid
async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const aiService = new GoogleAiService(apiKey);
    // Call a minimal test to verify the key works
    await aiService.testApiKey();
    return true;
  } catch (error) {
    console.error("API key verification failed:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const userId = params.userId;
    console.log("GET AI config for user:", userId);

    // Get the user document
    const userDoc = await adminDb.collection("users").doc(userId).get();

    // If user document doesn't exist, return default values
    // We don't create it on GET to avoid unnecessary writes
    if (!userDoc.exists) {
      console.log(`User document for ${userId} not found, returning defaults`);
      return NextResponse.json({
        isEnabled: false,
        hasApiKey: false,
      });
    }

    // Get the AI configuration
    const userData = userDoc.data();
    const aiConfig = userData?.aiConfig || { isEnabled: false };

    console.log(
      `Retrieved AI config for ${userId}: enabled=${aiConfig.isEnabled}, hasKey=${!!aiConfig.apiKey}`,
    );

    return NextResponse.json({
      isEnabled: aiConfig.isEnabled || false,
      hasApiKey: !!aiConfig.apiKey,
    });
  } catch (error) {
    console.error("Error fetching AI config:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const userId = params.userId;
    const { apiKey, isEnabled } = await request.json();

    // If an API key was provided, verify it
    if (apiKey) {
      console.log(`Verifying API key for user ${userId}`);
      const isValid = await verifyApiKey(apiKey);

      if (!isValid) {
        return NextResponse.json(
          {
            error: "Invalid API key. Please check your key and try again.",
          },
          { status: 400 },
        );
      }

      console.log("API key verification successful");
    }

    // Update user document - create if it doesn't exist
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    // If user document doesn't exist, create it with basic info
    if (!userDoc.exists) {
      console.log(`Creating new user document for ${userId}`);
      await userRef.set({
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiConfig: {
          isEnabled: isEnabled !== undefined ? isEnabled : false,
          ...(apiKey !== undefined && { apiKey }),
        },
      });
    } else {
      // Just update the AI config if user exists
      await userRef.set(
        {
          aiConfig: {
            isEnabled: isEnabled !== undefined ? isEnabled : false,
            ...(apiKey !== undefined && { apiKey }),
          },
          updatedAt: new Date(),
        },
        { merge: true },
      );
    }

    console.log(`Successfully updated AI config for ${userId}`);
    return NextResponse.json({
      success: true,
      isEnabled: isEnabled !== undefined ? isEnabled : false,
      hasApiKey: !!apiKey,
    });
  } catch (error) {
    console.error("Error updating AI config:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
