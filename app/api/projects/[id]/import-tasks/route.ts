import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const { tasks } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "No valid tasks provided" },
        { status: 400 },
      );
    }

    // Validate project exists
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all columns for the project to validate columnIds
    const columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", projectId)
      .get();

    const validColumnIds = columnsSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => doc.id,
    );

    if (validColumnIds.length === 0) {
      return NextResponse.json(
        { error: "Project has no columns to import tasks into" },
        { status: 400 },
      );
    }

    // Default to the first column if needed
    const defaultColumnId = validColumnIds[0];

    // Process tasks for import
    const batch = adminDb.batch();
    let importedCount = 0;

    for (const task of tasks) {
      // Create a new task document reference
      const taskRef = adminDb.collection("tasks").doc();

      // Prepare task data
      let taskData = {
        title: task.title,
        description: task.description || "",
        projectId: projectId, // Always use the current project ID
        columnId: validColumnIds.includes(task.columnId)
          ? task.columnId
          : defaultColumnId,
        status: task.status || "todo",
        priority: task.priority || "medium",
        isBlocked: task.isBlocked || false,
        dueDate: task.dueDate || null,
        // Get the max order value for the column
        order: task.order || 0, // This will be updated if necessary
        // Set new timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set the task in batch
      batch.set(taskRef, taskData);
      importedCount++;
    }

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Successfully imported ${importedCount} tasks`,
    });
  } catch (error) {
    console.error("Error importing tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to import tasks",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
