// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/services/singleton";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;

    const { mongoDb } = await getMongoDb();

    const projectDoc = await mongoDb
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
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const updateData = await request.json();

    const { mongoDb } = await getMongoDb();

    const result = await mongoDb
      .collection("projects")
      .updateOne(
        { _id: new ObjectId(projectId) },
        { $set: updateData },
      );

    return NextResponse.json({
      id: projectId,
      ...updateData,
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
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;

    const { mongoDb } = await getMongoDb();

    const result = await mongoDb
      .collection("projects")
      .deleteOne({ _id: new ObjectId(projectId) });

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
