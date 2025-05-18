// app/api/columns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

// Get columns for a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

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
    console.error("Error fetching columns:", error);
    return NextResponse.json(
      { error: "Failed to fetch columns" },
      { status: 500 },
    );
  }
}

// Create a new column
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.projectId || !data.name) {
      return NextResponse.json(
        { error: "Project ID and name are required" },
        { status: 400 },
      );
    }

    // Get the max order value to place this column at the end
    const columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", data.projectId)
      .orderBy("order", "desc")
      .limit(1)
      .get();

    const maxOrder = columnsSnapshot.empty
      ? 0
      : (columnsSnapshot.docs[0].data().order || 0) + 1;

    const columnRef = adminDb.collection("columns").doc();
    const columnData = {
      ...data,
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
