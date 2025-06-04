import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

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
      });
    }

    return NextResponse.json({
      ...config,
      id: config._id.toString(),
      _id: undefined,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating AI config:", error);
    return NextResponse.json(
      { error: "Failed to update AI config" },
      { status: 500 },
    );
  }
}
