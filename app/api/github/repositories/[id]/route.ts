// app/api/github/repositories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { githubServiceServer } from "@/services/github/githubServiceServer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const repoId = params.id;
    const repository = await adminDb
      .collection("repositories")
      .doc(repoId)
      .get();

    if (!repository.exists) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: repository.id,
      ...repository.data(),
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

    // Update repository
    await adminDb
      .collection("repositories")
      .doc(repoId)
      .update({
        ...data,
        updatedAt: new Date(),
      });

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

    // Get repository to ensure it exists
    const repoDoc = await adminDb.collection("repositories").doc(repoId).get();

    if (!repoDoc.exists) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    // Delete the repository
    await adminDb.collection("repositories").doc(repoId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 },
    );
  }
}
