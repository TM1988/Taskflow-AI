import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

// Validate OpenAI API key
async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error validating OpenAI key:', error);
    return false;
  }
}

// Validate Google AI Studio API key (keep for backward compatibility)
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
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    console.log("GET AI config for user:", userId);

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    const config = await mongoDb
      .collection("userAiConfigs")
      .findOne({ userId });

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        userId,
        aiProvider: "openai",
        apiKey: null,
        model: "gpt-3.5-turbo",
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
    console.error("Error fetching AI config:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI config" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const body = await request.json();

    console.log("PUT AI config for user:", userId, { ...body, apiKey: body.apiKey ? '***masked***' : undefined });

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
      userId,
      updatedAt: new Date(),
    };

    const result = await mongoDb
      .collection("userAiConfigs")
      .updateOne(
        { userId },
        { $set: updateData },
        { upsert: true },
      );

    // Return the updated config instead of just success
    const updatedConfig = await mongoDb
      .collection("userAiConfigs")
      .findOne({ userId });

    return NextResponse.json({
      ...updatedConfig,
      id: updatedConfig?._id.toString(),
      _id: undefined,
      hasApiKey: !!updatedConfig?.apiKey
    });
  } catch (error) {
    console.error("Error updating AI config:", error);
    return NextResponse.json(
      { error: "Failed to update AI config" },
      { status: 500 },
    );
  }
}

// Also support POST method for compatibility
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  return PUT(request, { params });
}
