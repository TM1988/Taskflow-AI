// app/api/projects/[id]/columns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;

    // Get columns for this project
    const columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", projectId)
      .orderBy("order", "asc")
      .get();

    const columns = columnsSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }),
    );

    return NextResponse.json(columns);
  } catch (error) {
    console.error("Error fetching project columns:", error);
    return NextResponse.json(
      { error: "Failed to fetch columns" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: "Column name is required" },
        { status: 400 },
      );
    }

    // Get the max order value to place this column at the end
    const columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", projectId)
      .orderBy("order", "desc")
      .limit(1)
      .get();

    const maxOrder = columnsSnapshot.empty
      ? 0
      : (columnsSnapshot.docs[0].data().order || 0) + 1;

    const columnRef = adminDb.collection("columns").doc();
    const columnData = {
      name: data.name,
      projectId: projectId,
      order: data.order !== undefined ? data.order : maxOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await columnRef.set(columnData);

    return NextResponse.json({
      id: columnRef.id,
      ...columnData,
    });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 },
    );
  }
}
