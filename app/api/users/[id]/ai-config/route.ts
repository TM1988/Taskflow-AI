// app/api/users/[id]/ai-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    console.log("GET AI config for user:", userId);

    const { mongoDb } = await getMongoDb();

    const userDoc = await mongoDb.collection("users").findOne({ _id: new ObjectId(userId) });
    
    if (!userDoc) {
      return NextResponse.json({
        isEnabled: false,
        hasApiKey: false,
      });
    }

    const aiConfig = userDoc.aiConfig || { isEnabled: false };
    
    return NextResponse.json({
      isEnabled: aiConfig.isEnabled || false,
      hasApiKey: !!aiConfig.apiKey,
    });
  } catch (error) {
    console.error("Error in AI config GET:", error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const body = await request.json();
    
    const { mongoDb } = await getMongoDb();

    await mongoDb.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          aiConfig: body,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in AI config POST:", error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
