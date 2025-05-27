// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    
    if (!adminDb) {
      throw new Error("Database not initialized");
    }

    const projectDoc = await adminDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!projectDoc) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: projectDoc._id.toString(),
      ...projectDoc,
      _id: undefined,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error fetching project:", err);
    return NextResponse.json(
      { error: "Failed to fetch project", details: err?.message || 'Unknown error' },
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
    
    if (!adminDb) {
      throw new Error("Database not initialized");
    }

    // Update the project
    await adminDb
      .collection("projects")
      .updateOne(
        { _id: new ObjectId(projectId) },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
      );

    return NextResponse.json({
      id: projectId,
      ...data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error updating project:", err);
    return NextResponse.json(
      { error: "Failed to update project", details: err?.message || 'Unknown error' },
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
    
    if (!adminDb) {
      throw new Error("Database not initialized");
    }

    // Check if project exists
    const projectDoc = await adminDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });
    if (!projectDoc) {
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

    const projectData = projectDoc;
    if (projectData?.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the project owner can delete a project" },
        { status: 403 },
      );
    }

    // Delete the project
    await adminDb.collection("projects").deleteOne({ _id: new ObjectId(projectId) });

    // TODO: In a production app, you'd also delete related resources
    // like tasks, columns, etc. in a transaction or with Cloud Functions

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error deleting project:", err);
    return NextResponse.json(
      { error: "Failed to delete project", details: err?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
