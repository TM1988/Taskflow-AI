import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/services/singleton"; // Import the correct function

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } },
) {
  try {
    const { id: projectId, userId } = params;

    const { mongoDb } = await getMongoDb(); // Use getMongoDb instead of getAdminDb

    const projectDoc = await mongoDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!projectDoc) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const members = projectDoc.members || [];
    const updatedMembers = members.filter((id: string) => id !== userId);

    await mongoDb
      .collection("projects")
      .updateOne(
        { _id: new ObjectId(projectId) },
        { $set: { members: updatedMembers, updatedAt: new Date() } },
      );

    const updatedProject = await mongoDb
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
