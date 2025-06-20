import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Since we're using Firebase, let's use Firestore instead of MongoDB
    const invitationRef = doc(db, "invitations", token);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    const invitationData = invitationSnap.data();

    // Check if invitation is still valid
    if (
      invitationData.status !== "pending" ||
      (invitationData.expiresAt &&
        invitationData.expiresAt.toDate() < new Date())
    ) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Get organization details
    const orgRef = doc(db, "organizations", invitationData.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();

    return NextResponse.json({
      organization: {
        id: orgSnap.id,
        name: orgData.name,
        memberCount: orgData.memberCount || 0,
        hasPassword: !!orgData.passwordHash,
      },
      role: {
        id: invitationData.roleId || "member",
        name: invitationData.roleName || "Member",
      },
      inviter: {
        name: invitationData.inviterName || "Team Member",
      },
      expiresAt: invitationData.expiresAt?.toDate(),
      isAlreadyMember: false, // TODO: Check if current user is already a member
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation details" },
      { status: 500 }
    );
  }
}
