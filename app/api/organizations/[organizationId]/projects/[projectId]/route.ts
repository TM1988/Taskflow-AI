import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; projectId: string } }
) {
  try {
    const { organizationId, projectId } = params;

    console.log(`Deleting project ${projectId} from organization ${organizationId}`);

    // Get organization
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    
    // Find the project to delete
    const projectToDelete = orgData.projects?.find((p: any) => p.id === projectId);
    
    if (!projectToDelete) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Remove project from organization
    await updateDoc(orgRef, {
      projects: arrayRemove(projectToDelete),
      updatedAt: serverTimestamp(),
    });

    // TODO: Also delete tasks associated with this project from MongoDB
    // This would require a separate API call to your MongoDB tasks API

    console.log(`Project ${projectId} deleted successfully`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
