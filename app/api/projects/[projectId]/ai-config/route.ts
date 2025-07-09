import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

// Validate Google AI Studio API key
async function validateGoogleAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error validating Google AI key:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    console.log("GET Project AI config for project:", projectId);

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    const config = await mongoDb
      .collection("projectAiConfigs")
      .findOne({ projectId });

    if (!config) {
      // Return default config if none exists - now defaults to Google AI Studio
      return NextResponse.json({
        projectId,
        aiProvider: "google",
        apiKey: null,
        model: "gemini-1.5-flash-latest",
        enabled: false,
        isEnabled: false,
        hasApiKey: false
      });
    }

    return NextResponse.json({
      ...config,
      id: config._id.toString(),
      _id: undefined,
      hasApiKey: !!config.apiKey
    });
  } catch (error) {
    console.error("Error fetching Project AI config:", error);
    return NextResponse.json(
      { error: "Failed to fetch Project AI config" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const body = await request.json();

    console.log("PUT Project AI config for project:", projectId, { ...body, apiKey: body.apiKey ? '***masked***' : undefined });

    // Validate API key if provided
    if (body.apiKey) {
      const isValid = await validateGoogleAIKey(body.apiKey);
      if (!isValid) {
        return NextResponse.json(
          { 
            error: "Invalid Google AI Studio API key. Please check your key and try again.",
            details: "The API key could not be validated with Google AI Studio. Make sure you have a valid API key from https://aistudio.google.com/app/apikeys"
          },
          { status: 400 }
        );
      }
    }

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    const updateData = {
      ...body,
      projectId,
      updatedAt: new Date(),
    };

    const result = await mongoDb
      .collection("projectAiConfigs")
      .updateOne(
        { projectId },
        { $set: updateData },
        { upsert: true },
      );

    // Return the updated config instead of just success
    const updatedConfig = await mongoDb
      .collection("projectAiConfigs")
      .findOne({ projectId });

    return NextResponse.json({
      ...updatedConfig,
      id: updatedConfig?._id.toString(),
      _id: undefined,
      hasApiKey: !!updatedConfig?.apiKey
    });
  } catch (error) {
    console.error("Error updating Project AI config:", error);
    return NextResponse.json(
      { error: "Failed to update Project AI config" },
      { status: 500 },
    );
  }
}

// Also support POST method for compatibility
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  return PUT(request, { params });
}
