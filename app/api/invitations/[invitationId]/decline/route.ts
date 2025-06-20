import { NextRequest, NextResponse } from "next/server";
import { 
  doc, 
  updateDoc, 
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

    // Mark invitation as declined
    const invitationRef = doc(db, "invitations", invitationId);
    await updateDoc(invitationRef, {
      status: "declined",
      declinedAt: serverTimestamp(),
      declinedBy: userId,
    });

    console.log(`Invitation ${invitationId} declined by user ${userId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error declining invitation:", error);
    return NextResponse.json(
      { error: "Failed to decline invitation" },
      { status: 500 }
    );
  }
}
