import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    console.log(`Looking up invitation by token: ${token}`);

    const invitationsRef = collection(db, "invitations");
    const q = query(
      invitationsRef,
      where("token", "==", token),
      where("status", "==", "pending")
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No invitation found for token: ${token}`);
      return NextResponse.json(
        { error: "Invitation not found or expired" },
        { status: 404 }
      );
    }

    const invitationDoc = querySnapshot.docs[0];
    const invitationData = invitationDoc.data();

    // Check if invitation is expired
    const expiresAt = invitationData.expiresAt?.toDate() || new Date(invitationData.expiresAt);
    const now = new Date();

    if (expiresAt <= now) {
      console.log(`Invitation ${invitationDoc.id} has expired`);
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    const result = {
      id: invitationDoc.id,
      ...invitationData,
      createdAt: invitationData.createdAt?.toDate?.()?.toISOString() || invitationData.createdAt,
      expiresAt: expiresAt.toISOString(),
    };

    console.log(`Found valid invitation: ${invitationDoc.id}`);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching invitation by token:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
