import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;
    const tasks = await request.json();

    // Verify the project exists
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify columns exist
    const columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", projectId)
      .get();

    if (columnsSnapshot.empty) {
      return NextResponse.json(
        { error: "No columns found for this project" },
        { status: 400 },
      );
    }

    const columnIds = columnsSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => doc.id,
    );

    // Process and validate tasks
    const batch = adminDb.batch();
    const importedTasks = [];

    for (const task of tasks) {
      // If columnId isn't in this project's columns, assign to the first column
      if (!columnIds.includes(task.columnId)) {
        task.columnId = columnIds[0];
      }

      // Always use the current project ID (prevents importing to wrong project)
      task.projectId = projectId;

      // Get the max order for the column
      const columnTasksSnapshot = await adminDb
        .collection("tasks")
        .where("columnId", "==", task.columnId)
        .orderBy("order", "desc")
        .limit(1)
        .get();

      const maxOrder = columnTasksSnapshot.empty
        ? 0
        : (columnTasksSnapshot.docs[0].data().order || 0) + 1;

      // Create a new task document
      const taskRef = adminDb.collection("tasks").doc();
      const taskData = {
        title: task.title,
        description: task.description || "",
        projectId: projectId,
        columnId: task.columnId,
        status: task.status || "todo",
        priority: task.priority || "medium",
        order: maxOrder,
        isBlocked: task.isBlocked || false,
        dueDate: task.dueDate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(taskRef, taskData);
      importedTasks.push({
        id: taskRef.id,
        ...taskData,
      });
    }

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedTasks.length} tasks`,
      tasks: importedTasks,
    });
  } catch (error) {
    console.error("Error importing tasks:", error);
    return NextResponse.json(
      { error: "Failed to import tasks", details: String(error) },
      { status: 500 },
    );
  }
}
