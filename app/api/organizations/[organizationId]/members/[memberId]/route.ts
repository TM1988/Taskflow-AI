import { NextRequest, NextResponse } from "next/server";
import { 
  doc, 
  getDoc, 
  updateDoc,
  arrayRemove,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; memberId: string } }
) {
  try {
    const { organizationId, memberId } = params;
    
    console.log(`Removing member ${memberId} from organization ${organizationId}`);

    const orgRef = doc(db, "organizations", organizationId);
    
    // Check if organization exists
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    
    // Check if user is the owner (owners cannot be removed)
    if (orgData.ownerId === memberId) {
      return NextResponse.json(
        { error: "Cannot remove organization owner" },
        { status: 400 }
      );
    }

    // Remove member from the members array
    await updateDoc(orgRef, {
      members: arrayRemove(memberId),
      memberCount: (orgData.memberCount || 1) - 1,
      updatedAt: serverTimestamp(),
    });

    console.log(`Member ${memberId} removed successfully from organization ${organizationId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
