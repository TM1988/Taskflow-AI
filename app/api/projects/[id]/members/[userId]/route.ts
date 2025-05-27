import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } },
) {
  try {
    const { id: projectId, userId } = params;

    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const projectDoc = await adminDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!projectDoc) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const members = projectDoc.members || [];
    const updatedMembers = members.filter((id: string) => id !== userId);

    await adminDb
      .collection("projects")
      .updateOne(
        { _id: new ObjectId(projectId) },
        { $set: { members: updatedMembers, updatedAt: new Date() } },
      );

    const updatedProject = await adminDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    return NextResponse.json({
      id: updatedProject?._id.toString(),
      ...updatedProject,
      _id: undefined,
    });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 },
    );
  }
}
