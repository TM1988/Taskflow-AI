// app/api/columns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

// Get a specific column
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const columnId = params.id;
    const columnDoc = await adminDb.collection("columns").doc(columnId).get();

    if (!columnDoc.exists) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: columnDoc.id,
      ...columnDoc.data(),
    });
  } catch (error) {
    console.error("Error fetching column:", error);
    return NextResponse.json(
      { error: "Failed to fetch column" },
      { status: 500 },
    );
  }
}

// Update a column
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const columnId = params.id;
    const data = await request.json();

    await adminDb
      .collection("columns")
      .doc(columnId)
      .update({
        ...data,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true, id: columnId });
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 },
    );
  }
}

// Delete a column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const columnId = params.id;
    await adminDb.collection("columns").doc(columnId).delete();
    return NextResponse.json({ success: true, id: columnId });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 },
    );
  }
}
