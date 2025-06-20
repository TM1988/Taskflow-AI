import { NextRequest, NextResponse } from "next/server";

// Stub endpoint for notifications - returns empty array since notifications are disabled
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Return empty array since notification center is removed
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error in notifications stub:", error);
    return NextResponse.json([], { status: 200 });
  }
}
