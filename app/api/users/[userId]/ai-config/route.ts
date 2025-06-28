import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    console.log('GET AI config for user:', userId);
    
    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    const userAiConfig = await mongoDb.collection('userAiConfigs').findOne({ userId });
    
    if (userAiConfig) {
      return NextResponse.json({
        userId,
        isEnabled: userAiConfig.isEnabled || false,
        apiKey: userAiConfig.apiKey || '',
        model: userAiConfig.model || 'gemini-pro',
        temperature: userAiConfig.temperature || 0.7,
        maxTokens: userAiConfig.maxTokens || 1000,
      });
    } else {
      // Return default config for new users
      return NextResponse.json({
        userId,
        isEnabled: false,
        apiKey: '',
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000,
      });
    }
  } catch (error) {
    console.error("Error fetching AI config:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI config" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const config = await request.json();
    console.log('PUT AI config for user:', userId, 'Config:', config);
    
    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    // Validate API key only if AI is being enabled and key is provided
    if (config.isEnabled && config.apiKey) {
      // Test the API key with a simple request
      try {
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Hello"
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          }),
        });
        
        if (!testResponse.ok) {
          console.error('API key validation failed:', testResponse.status, testResponse.statusText);
          return NextResponse.json(
            { error: "Invalid API key. Please check your Google AI API key." },
            { status: 400 }
          );
        }
        console.log('API key validation successful');
      } catch (error) {
        console.error('API key validation error:', error);
        return NextResponse.json(
          { error: "Unable to validate API key. Please check your internet connection." },
          { status: 400 }
        );
      }
    }
    
    // Update or create the AI config
    const updateData = {
      userId,
      isEnabled: config.isEnabled || false,
      apiKey: config.apiKey || '',
      model: config.model || 'gemini-pro',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      updatedAt: new Date(),
    };
    
    const result = await mongoDb.collection('userAiConfigs').updateOne(
      { userId },
      { $set: updateData },
      { upsert: true }
    );
    
    console.log('AI config update result:', result);
    
    return NextResponse.json({
      success: true,
      message: config.isEnabled ? 'AI configuration saved successfully!' : 'AI disabled successfully!',
      ...updateData,
    });
  } catch (error) {
    console.error("Error updating AI config:", error);
    return NextResponse.json(
      { error: "Failed to update AI config" },
      { status: 500 }
    );
  }
}
