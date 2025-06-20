import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const orgRef = doc(db, "organizations", params.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgData = orgSnap.data();
    const settings = {
      projectLimit: 5, // Fixed limit per organization
      currentCount: orgData.projectCount || 0,
      isLimitEnforced: true,
      canCreateProjects: (orgData.projectCount || 0) < 5
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching project limit settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch project limit settings" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Project limits are fixed at 5, so this endpoint doesn't change anything
    // but we provide it for API consistency
    return NextResponse.json({ 
      success: true,
      message: "Project limits are preset and cannot be modified" 
    });
  } catch (error) {
    console.error("Error updating project limit settings:", error);
    return NextResponse.json(
      { error: "Failed to update project limit settings" },
      { status: 500 }
    );
  }
}
