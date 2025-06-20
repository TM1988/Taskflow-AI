import { NextRequest, NextResponse } from "next/server";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    console.log(`Fetching organization: ${organizationId}`);

    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      console.log(`Organization not found: ${organizationId}`);
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    
    // Convert Firestore timestamps to ISO strings for all date fields
    const convertTimestamp = (timestamp: any) => {
      if (!timestamp) return null;
      if (timestamp && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toISOString();
      }
      return timestamp;
    };

    // Convert memberJoinDates object
    const memberJoinDates: any = {};
    if (orgData.memberJoinDates) {
      Object.keys(orgData.memberJoinDates).forEach(memberId => {
        memberJoinDates[memberId] = convertTimestamp(orgData.memberJoinDates[memberId]);
      });
    }

    const result = {
      id: organizationId,
      ...orgData,
      memberCount: orgData.members?.length || 1,
      memberRoles: orgData.memberRoles || {},
      memberJoinDates: memberJoinDates,
      createdAt: convertTimestamp(orgData.createdAt),
      updatedAt: convertTimestamp(orgData.updatedAt),
    };

    console.log(`Organization ${organizationId} data:`, {
      memberJoinDates: result.memberJoinDates,
      createdAt: result.createdAt
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const updates = await request.json();
    
    console.log(`Updating organization: ${organizationId}`);

    const orgRef = doc(db, "organizations", organizationId);
    
    // Check if organization exists
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update the organization
    await updateDoc(orgRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Get updated document
    const updatedSnap = await getDoc(orgRef);
    const updatedData = updatedSnap.data();

    const result = {
      id: updatedSnap.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };

    console.log(`Organization updated successfully: ${organizationId}`);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
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
    
    console.log(`Soft-deleting organization: ${organizationId}`);

    const orgRef = doc(db, "organizations", organizationId);
    
    // Check if organization exists
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Soft delete by marking as deleted
    await updateDoc(orgRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Also soft delete all projects belonging to this organization
    const projectsQuery = query(
      collection(db, "projects"),
      where("organizationId", "==", organizationId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    const deleteProjectPromises = projectsSnapshot.docs.map((projectDoc: any) => {
      return updateDoc(doc(db, "projects", projectDoc.id), {
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await Promise.all(deleteProjectPromises);
    
    console.log(`Organization and ${projectsSnapshot.size} projects soft-deleted successfully: ${organizationId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
