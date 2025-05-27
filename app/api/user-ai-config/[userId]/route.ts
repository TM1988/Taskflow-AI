import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/mongoAdmin";
import { GoogleAiService } from "@/services/ai/googleAiService";
import { ObjectId } from "mongodb";

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

    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    // Get the user document
    const userDoc = await adminDb
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    // If user document doesn't exist, return default values
    if (!userDoc) {
      console.log(`User document for ${userId} not found, returning defaults`);
      return NextResponse.json({
        isEnabled: false,
        hasApiKey: false,
      });
    }

    // Get the AI configuration
    const aiConfig = userDoc.aiConfig || { isEnabled: false };

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

    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    // Update user document - create if it doesn't exist
    const userDoc = await adminDb
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    // If user document doesn't exist, create it with basic info
    if (!userDoc) {
      console.log(`Creating new user document for ${userId}`);
      await adminDb.collection("users").insertOne({
        _id: new ObjectId(userId),
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
      await adminDb.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            "aiConfig.isEnabled": isEnabled !== undefined ? isEnabled : false,
            ...(apiKey !== undefined && { "aiConfig.apiKey": apiKey }),
            updatedAt: new Date(),
          },
        },
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
