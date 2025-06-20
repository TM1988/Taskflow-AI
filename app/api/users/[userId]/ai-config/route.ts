import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Mock AI config data
    return NextResponse.json({
      userId,
      aiEnabled: true,
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 1000,
    });
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
    
    // Mock updating AI config
    return NextResponse.json({
      userId,
      ...config,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating AI config:", error);
    return NextResponse.json(
      { error: "Failed to update AI config" },
      { status: 500 }
    );
  }
}
