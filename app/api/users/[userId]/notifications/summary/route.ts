import { NextRequest, NextResponse } from "next/server";

// Stub endpoint for notification summary - returns empty response since notifications are disabled
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Return empty summary since notification center is removed
    return NextResponse.json({
      total: 0,
      unread: 0,
      priorities: { high: 0, medium: 0, low: 0 },
      types: {}
    });
  } catch (error) {
    console.error("Error in notification summary stub:", error);
    return NextResponse.json({
      total: 0,
      unread: 0,
      priorities: { high: 0, medium: 0, low: 0 },
      types: {}
    }, { status: 200 });
  }
}
