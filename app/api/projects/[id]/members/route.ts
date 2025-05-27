import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const { userId } = await request.json();

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
    if (!members.includes(userId)) {
      members.push(userId);
      await adminDb
        .collection("projects")
        .updateOne(
          { _id: new ObjectId(projectId) },
          { $set: { members, updatedAt: new Date() } },
        );
    }

    const updatedProject = await adminDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    return NextResponse.json({
      id: updatedProject?._id.toString(),
      ...updatedProject,
      _id: undefined,
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 },
    );
  }
}
