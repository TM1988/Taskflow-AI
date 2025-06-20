import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    // Return mock members data
    const mockMembers = [
      {
        id: "member-1",
        userId: "mock-user-1",
        roleId: "role-1",
        roleName: "Owner",
        roleRank: 1,
        joinedAt: new Date(),
        displayName: "Mock User",
        email: "mock@example.com",
        photoURL: null,
      }
    ];

    return NextResponse.json(mockMembers);

  } catch (error) {
    console.error("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
