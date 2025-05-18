// app/api/users/[id]/ai-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    console.log("GET AI config for user:", userId);

    // Return a simple response for testing
    return NextResponse.json({
      isEnabled: false,
      hasApiKey: false,
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
    console.log("POST AI config for user:", userId);

    // For testing, just log what we received
    const body = await request.json();
    console.log("Received data:", body);

    // Return a simple success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in AI config POST:", error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
