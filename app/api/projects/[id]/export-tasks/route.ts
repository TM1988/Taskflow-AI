import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    // Get all tasks for the project
    const tasksSnapshot = await adminDb
      .collection("tasks")
      .where("projectId", "==", projectId)
      .get();

    // Transform tasks to the required format
    const tasks = tasksSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => {
        const data = doc.data();

        // Return the task with its ID
        return {
          id: doc.id,
          ...data,
          // We keep the createdAt and updatedAt format as they are
          // which matches the Firebase Timestamp format with _seconds and _nanoseconds
        };
      },
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error exporting tasks:", error);
    return NextResponse.json(
      { error: "Failed to export tasks" },
      { status: 500 },
    );
  }
}
