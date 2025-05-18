// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: projectDoc.id,
      ...projectDoc.data(),
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const data = await request.json();

    // Update the project
    await adminDb
      .collection("projects")
      .doc(projectId)
      .update({
        ...data,
        updatedAt: new Date(),
      });

    return NextResponse.json({
      id: projectId,
      ...data,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;

    // Check if project exists
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify the user is the owner (from client auth)
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const projectData = projectDoc.data();
    if (projectData?.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the project owner can delete a project" },
        { status: 403 },
      );
    }

    // Delete the project
    await adminDb.collection("projects").doc(projectId).delete();

    // TODO: In a production app, you'd also delete related resources
    // like tasks, columns, etc. in a transaction or with Cloud Functions

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
