import { NextRequest, NextResponse } from "next/server";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const { invitationId } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitationRef = doc(db, "invitations", invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    const invitationData = invitationSnap.data();

    // Check if invitation is still valid
    const expiresAt = invitationData.expiresAt?.toDate() || new Date(invitationData.expiresAt);
    if (expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (invitationData.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation is no longer pending" },
        { status: 400 }
      );
    }

    // Add user to organization
    const orgRef = doc(db, "organizations", invitationData.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();

    // Update organization with new member
    const updatedMembers = [...(orgData.members || []), userId];
    const updatedMemberRoles = {
      ...(orgData.memberRoles || {}),
      [userId]: invitationData.roleId
    };
    const updatedMemberJoinDates = {
      ...(orgData.memberJoinDates || {}),
      [userId]: serverTimestamp() // Use serverTimestamp for consistency
    };

    await updateDoc(orgRef, {
      members: updatedMembers,
      memberRoles: updatedMemberRoles,
      memberJoinDates: updatedMemberJoinDates,
      memberCount: (orgData.memberCount || 1) + 1,
      updatedAt: serverTimestamp(),
    });

    // Mark invitation as accepted
    await updateDoc(invitationRef, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      acceptedBy: userId,
    });

    console.log(`Invitation ${invitationId} accepted by user ${userId} with role ${invitationData.roleId} at ${new Date().toISOString()}`);
    return NextResponse.json({ 
      success: true,
      organizationId: invitationData.organizationId,
      role: invitationData.roleId
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
