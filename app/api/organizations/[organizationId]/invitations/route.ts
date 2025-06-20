import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sent';
    const userId = searchParams.get('userId');

    if (!userId && type === 'sent') {
      return NextResponse.json(
        { error: "userId parameter is required for sent invitations" },
        { status: 400 }
      );
    }

    const invitationsRef = collection(db, "invitations");
    let q;

    if (type === 'sent') {
      // Get invitations for this organization (regardless of inviter for now since we don't store inviter properly)
      q = query(
        invitationsRef,
        where("organizationId", "==", organizationId),
        where("status", "==", "pending")
      );
    } else {
      // Get invitations received by this user's email
      // Note: We'll need the user's email for this
      const userEmail = searchParams.get('userEmail');
      if (!userEmail) {
        return NextResponse.json(
          { error: "userEmail parameter is required for received invitations" },
          { status: 400 }
        );
      }

      q = query(
        invitationsRef,
        where("invitedEmail", "==", userEmail),
        where("status", "==", "pending")
      );
    }

    const querySnapshot = await getDocs(q);
    const invitations: any[] = [];

    // Get current time to check for expired invitations
    const now = new Date();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate() || new Date(data.expiresAt);
      
      // Only include non-expired invitations
      if (expiresAt > now) {
        invitations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          expiresAt: expiresAt.toISOString(),
        });
      }
    });

    console.log(`Found ${invitations.length} ${type} invitations for organization ${organizationId}`);
    return NextResponse.json(invitations);

  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { invitationId } = await request.json();

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 }
      );
    }

    // Delete the invitation
    await deleteDoc(doc(db, "invitations", invitationId));

    console.log(`Invitation ${invitationId} cancelled successfully`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
