import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAuth } from "@/services/firebase/admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user's token
    const adminAuth = getFirebaseAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { projectId } = params;

    // Get project data to check repository assignments
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();
    const repositories = projectData.repositories || [];

    return NextResponse.json({
      repositories,
    });
  } catch (error) {
    console.error("Error fetching project repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch project repositories" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user's token
    const adminAuth = getFirebaseAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { projectId } = params;
    const { repositories } = await request.json();

    // Update project with repository assignments
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      repositories: repositories || [],
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("Error updating project repositories:", error);
    return NextResponse.json(
      { error: "Failed to update project repositories" },
      { status: 500 }
    );
  }
}
