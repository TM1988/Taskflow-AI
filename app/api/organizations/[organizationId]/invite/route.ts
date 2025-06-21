import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendOrganizationInvitation } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { email, roleId = "member", inviterName = "Someone", inviterId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log(`Creating invitation for ${email} to organization ${organizationId}`);

    // Get organization details
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);
    
    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();

    // Check for existing pending invitation
    const invitationsRef = collection(db, "invitations");
    const q = query(
      invitationsRef,
      where("organizationId", "==", organizationId),
      where("invitedEmail", "==", email),
      where("status", "==", "pending")
    );

    const existingInvitations = await getDocs(q);
    
    // Check if any existing invitations are still valid (not expired)
    const now = new Date();
    let hasValidInvitation = false;
    
    existingInvitations.forEach((doc) => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate() || new Date(data.expiresAt);
      if (expiresAt > now) {
        hasValidInvitation = true;
      }
    });

    if (hasValidInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitationData = {
      organizationId,
      invitedEmail: email,
      inviterId: inviterId || "system", // Use provided inviter ID or fallback
      roleId,
      token,
      expiresAt: expiryDate,
      status: "pending",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "invitations"), invitationData);
    console.log(`Invitation created with ID: ${docRef.id}`);

    // Send email invitation
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
      }
      
      const inviteUrl = `${baseUrl}/invite/${token}`;
      
      await sendOrganizationInvitation({
        to: email,
        organizationName: orgData.name,
        inviterName: inviterName,
        inviteUrl: inviteUrl,
        expiresAt: expiryDate,
      });

      console.log(`Email invitation sent successfully to ${email}`);
    } catch (emailError) {
      console.error('Failed to send email invitation:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Invitation sent successfully",
      invitationId: docRef.id
    });

  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
