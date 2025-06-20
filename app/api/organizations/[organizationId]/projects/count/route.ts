import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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

    // Get actual project count directly from Firestore
    const projectsRef = collection(db, "projects");
    const projectsQuery = query(
      projectsRef,
      where("organizationId", "==", params.organizationId),
      where("isDeleted", "!=", true)
    );
    const projectsSnap = await getDocs(projectsQuery);
    const projectCount = projectsSnap.size;

    return NextResponse.json({
      count: projectCount,
      limit: 5,
      remaining: Math.max(0, 5 - projectCount),
      isAtLimit: projectCount >= 5
    });
  } catch (error) {
    console.error("Error fetching project count:", error);
    return NextResponse.json(
      { error: "Failed to fetch project count" },
      { status: 500 }
    );
  }
}
