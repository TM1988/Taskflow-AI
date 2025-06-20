import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { newOwnerId } = await request.json();

    console.log(`Transferring ownership of organization ${organizationId} to ${newOwnerId}`);

    if (!newOwnerId) {
      return NextResponse.json(
        { error: "New owner ID is required" },
        { status: 400 }
      );
    }

    // Get organization
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    
    // Check if new owner is a member of the organization
    if (!orgData.members?.includes(newOwnerId)) {
      return NextResponse.json(
        { error: "New owner must be a member of the organization" },
        { status: 400 }
      );
    }

    // Update organization with new owner
    const updatedMemberRoles = {
      ...(orgData.memberRoles || {}),
      [newOwnerId]: "owner"
    };

    // Remove the previous owner from member roles (they become regular member)
    if (orgData.ownerId && orgData.ownerId !== newOwnerId) {
      updatedMemberRoles[orgData.ownerId] = "member";
    }

    await updateDoc(orgRef, {
      ownerId: newOwnerId,
      memberRoles: updatedMemberRoles,
      updatedAt: serverTimestamp(),
    });

    console.log(`Ownership transferred successfully to ${newOwnerId}`);
    return NextResponse.json({ 
      success: true,
      newOwnerId 
    });

  } catch (error) {
    console.error("Error transferring ownership:", error);
    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 }
    );
  }
}
