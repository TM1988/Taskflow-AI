// app/api/github/repositories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const repoId = params.id;
    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    const repository = await adminDb
      .collection("repositories")
      .findOne({ _id: new ObjectId(repoId) });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: repository._id.toString(),
      ...repository,
      _id: undefined,
    });
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const repoId = params.id;
    const data = await request.json();
    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Update repository
    await adminDb
      .collection("repositories")
      .updateOne(
        { _id: new ObjectId(repoId) },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          }
        }
      );

    return NextResponse.json({ success: true, id: repoId });
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: "Failed to update repository" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const repoId = params.id;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Get repository to ensure it exists
    const repoDoc = await adminDb.collection("repositories").findOne({ _id: new ObjectId(repoId) });

    if (!repoDoc) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    // Delete the repository
    await adminDb.collection("repositories").deleteOne({ _id: new ObjectId(repoId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 },
    );
  }
}
