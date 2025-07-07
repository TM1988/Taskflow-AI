import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

// Validate Google AI Studio API key (only provider supported)
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

    // Initialize MongoDB with retry logic
    try {
      await initializeMongoDB();
    } catch (mongoError) {
      console.error("MongoDB initialization failed:", mongoError);
      return NextResponse.json(
        { 
          error: "Database connection failed. Please try again in a moment.",
          details: "We're experiencing temporary database connectivity issues."
        },
        { status: 503 }
      );
    }

    const { mongoDb } = await getMongoDb();

    const config = await mongoDb
      .collection("userAiConfigs")
      .findOne({ userId });

    if (!config) {
      // Return default config if none exists - now defaults to Google AI Studio
      return NextResponse.json({
        userId,
        aiProvider: "google",
        apiKey: null,
        model: "gemini-pro",
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
    
    // Provide more specific error messages
    if (error instanceof Error && (
      error.message.includes('MongoServerSelectionError') || 
      error.message.includes('SSL') || 
      error.message.includes('TLS')
    )) {
      return NextResponse.json(
        { 
          error: "Database connection issue. Please try again.",
          details: "We're experiencing temporary database connectivity issues."
        },
        { status: 503 }
      );
    }
    
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

    // Validate API key if provided and provider is specified
    if (body.apiKey && body.aiProvider) {
      let isValid = false;
      
      try {
        // Only Google AI Studio is supported
        if (body.aiProvider === 'google') {
          isValid = await validateGoogleAIKey(body.apiKey);
          if (!isValid) {
            return NextResponse.json(
              { 
                error: "Invalid Google AI Studio API key. Please check your key and try again.",
                details: "The API key could not be validated with Google AI Studio. Make sure you have a valid API key from https://aistudio.google.com/app/apikeys"
              },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { 
              error: "Only Google AI Studio is supported as an AI provider",
              details: "Please use Google AI Studio as your AI provider. You can get an API key from https://aistudio.google.com/app/apikeys"
            },
            { status: 400 }
          );
        }
      } catch (validationError) {
        console.error("API key validation error:", validationError);
        return NextResponse.json(
          { 
            error: "Could not validate API key due to network error. Please try again.",
            details: "There was an issue connecting to the AI provider's API for validation. Please check your internet connection and try again."
          },
          { status: 500 }
        );
      }
    }

    // Initialize MongoDB with retry logic
    try {
      await initializeMongoDB();
    } catch (mongoError) {
      console.error("MongoDB initialization failed:", mongoError);
      return NextResponse.json(
        { 
          error: "Database connection failed. Please try again in a moment.",
          details: "We're experiencing temporary database connectivity issues. Please wait a moment and try again."
        },
        { status: 503 }
      );
    }

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

    console.log("✅ AI config updated successfully for user:", userId);

    return NextResponse.json({
      ...updatedConfig,
      id: updatedConfig?._id.toString(),
      _id: undefined,
      hasApiKey: !!updatedConfig?.apiKey
    });
  } catch (error) {
    console.error("Error updating AI config:", error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('MongoServerSelectionError') || error.message.includes('SSL') || error.message.includes('TLS')) {
        return NextResponse.json(
          { 
            error: "Database connection issue. Please try again.",
            details: "We're experiencing temporary database connectivity issues. Please wait a moment and try again.",
            troubleshooting: "If this persists, please check your internet connection or contact support."
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: "Request timed out. Please try again.",
            details: "The request took too long to process. Please try again in a moment."
          },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update AI config",
        details: "An unexpected error occurred. Please try again or contact support if the issue persists."
      },
      { status: 500 }
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
