import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching deleted organizations for user: ${userId}`);

    // Query for deleted organizations
    // For now, return empty array since we don't have soft delete implemented yet
    // TODO: Implement actual soft delete functionality
    const deletedOrganizations: any[] = [];

    return NextResponse.json(deletedOrganizations);

  } catch (error) {
    console.error("Error fetching deleted organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted organizations" },
      { status: 500 }
    );
  }
}
