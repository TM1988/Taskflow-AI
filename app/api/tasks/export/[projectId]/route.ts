import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;

    // Verify the project exists
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all tasks for the project
    const tasksSnapshot = await adminDb
      .collection("tasks")
      .where("projectId", "==", projectId)
      .get();

    const tasks = tasksSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }),
    );

    // Return the tasks as JSON
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error exporting tasks:", error);
    return NextResponse.json(
      { error: "Failed to export tasks" },
      { status: 500 },
    );
  }
}
