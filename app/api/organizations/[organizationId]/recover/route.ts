import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    console.log(`Recovering organization: ${organizationId}`);

    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();

    // Check if organization is actually deleted
    if (!orgData.deleted) {
      return NextResponse.json(
        { error: "Organization is not deleted" },
        { status: 400 }
      );
    }

    // Check if recovery window is still valid (24 hours)
    const deletedAt = orgData.deletedAt?.toDate ? orgData.deletedAt.toDate() : new Date(orgData.deletedAt);
    const now = new Date();
    const hoursSinceDeleted = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceDeleted > 24) {
      return NextResponse.json(
        { error: "Recovery window has expired (24 hours)" },
        { status: 400 }
      );
    }

    // Restore organization by removing deleted flag
    await updateDoc(orgRef, {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp()
    });

    console.log(`Organization ${organizationId} recovered successfully`);
    
    return NextResponse.json({ 
      success: true,
      message: "Organization recovered successfully"
    });

  } catch (error) {
    console.error("Error recovering organization:", error);
    return NextResponse.json(
      { error: "Failed to recover organization" },
      { status: 500 }
    );
  }
}
