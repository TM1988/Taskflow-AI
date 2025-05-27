// app/api/users/[id]/ai-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    console.log("GET AI config for user:", userId);

    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const userDoc = await adminDb.collection("users").findOne({ _id: new ObjectId(userId) });
    
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
    
    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    await adminDb.collection("users").updateOne(
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
