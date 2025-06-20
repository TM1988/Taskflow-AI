import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string; memberId: string } }
) {
  try {
    const { organizationId, memberId } = params;
    const { role } = await request.json();

    console.log(`API: Updating role for member ${memberId} in organization ${organizationId} to ${role}`);

    if (!role || !["member", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required (member or admin)" },
        { status: 400 }
      );
    }

    // Get organization
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      console.log(`API: Organization ${organizationId} not found`);
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();

    // Check if member exists in organization
    if (!orgData.members?.includes(memberId)) {
      console.log(`API: Member ${memberId} not found in organization ${organizationId}`);
      return NextResponse.json(
        { error: "Member not found in organization" },
        { status: 404 }
      );
    }

    // Cannot change owner role
    if (memberId === orgData.ownerId) {
      console.log(`API: Attempt to change owner role blocked`);
      return NextResponse.json(
        { error: "Cannot change owner role" },
        { status: 403 }
      );
    }

    // Update member role
    const updatedMemberRoles = {
      ...(orgData.memberRoles || {}),
      [memberId]: role
    };

    await updateDoc(orgRef, {
      memberRoles: updatedMemberRoles,
      updatedAt: serverTimestamp(),
    });

    console.log(`API: Member ${memberId} role updated to ${role} successfully`);
    return NextResponse.json({ 
      success: true,
      memberId,
      role
    });

  } catch (error) {
    console.error("API Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
