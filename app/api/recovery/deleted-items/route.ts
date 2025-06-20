import { NextRequest, NextResponse } from "next/server";

// Stub endpoint for recovery deleted items - returns empty array since recovery is disabled
export async function GET(request: NextRequest) {
  try {
    // Return empty array since recovery center is removed
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error in recovery deleted-items stub:", error);
    return NextResponse.json([], { status: 200 });
  }
}
