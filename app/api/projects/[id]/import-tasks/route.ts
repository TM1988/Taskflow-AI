import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

interface ImportData {
  metadata?: {
    exportedAt: string | Date;
    projectId: string;
    projectName: string;
    version: string;
  };
  columns?: any[];
  tasks: any[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const importData: ImportData = await request.json();
    
    // Handle both new format (with metadata and columns) and old format (just tasks array)
    const tasks = Array.isArray(importData) ? importData : importData.tasks || [];
    const columns = importData.columns || [];

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

    // Get existing columns for the project
    const columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", projectId)
      .get();

    const existingColumns = columnsSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }),
    );

    const existingColumnIds = existingColumns.map((col: any) => col.id);
    
    // Create a batch for all operations
    const batch = adminDb.batch();
    let importedColumnCount = 0;
    let importedTaskCount = 0;
    
    // Column ID mapping (from imported to new)
    const columnIdMap = new Map();
    
    // Import columns if provided (but don't duplicate existing ones by name)
    if (Array.isArray(columns) && columns.length > 0) {
      const existingColumnNames = existingColumns.map((col: any) => col.name.toLowerCase());
      
      for (const column of columns) {
        // Skip if a column with this name already exists
        if (existingColumnNames.includes(column.name.toLowerCase())) {
          // Find the existing column with this name to map IDs
          const existingColumn = existingColumns.find(
            (col: any) => col.name.toLowerCase() === column.name.toLowerCase()
          );
          if (existingColumn) {
            columnIdMap.set(column.id, existingColumn.id);
          }
          continue;
        }
        
        // Create a new column
        const columnRef = adminDb.collection("columns").doc();
        const columnData = {
          name: column.name,
          projectId: projectId,
          order: column.order || existingColumns.length + importedColumnCount,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        batch.set(columnRef, columnData);
        columnIdMap.set(column.id, columnRef.id);
        importedColumnCount++;
      }
    }
    
    // If we still have no columns, create a default one
    if (existingColumnIds.length === 0 && importedColumnCount === 0) {
      const defaultColumnRef = adminDb.collection("columns").doc();
      batch.set(defaultColumnRef, {
        name: "To Do",
        projectId: projectId,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      existingColumnIds.push(defaultColumnRef.id);
      importedColumnCount++;
    }

    // Default to the first column if needed
    const defaultColumnId = existingColumnIds[0];

    // Process tasks for import
    for (const task of tasks) {
      // Create a new task document reference
      const taskRef = adminDb.collection("tasks").doc();
      
      // Map the column ID if needed
      let columnId = task.columnId;
      if (columnIdMap.has(task.columnId)) {
        // Use the mapped ID for imported columns
        columnId = columnIdMap.get(task.columnId);
      } else if (!existingColumnIds.includes(task.columnId)) {
        // Fallback to default column if the column ID doesn't exist
        columnId = defaultColumnId;
      }

      // Prepare task data
      let taskData = {
        title: task.title,
        description: task.description || "",
        projectId: projectId, // Always use the current project ID
        columnId: columnId,
        status: task.status || "todo",
        priority: task.priority || "medium",
        isBlocked: task.isBlocked || false,
        dueDate: task.dueDate || null,
        assigneeId: task.assigneeId || null,
        assigneeName: task.assigneeName || null,
        tags: Array.isArray(task.tags) ? task.tags : [],
        blockReason: task.blockReason || "",
        order: task.order || 0,
        // Set new timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set the task in batch
      batch.set(taskRef, taskData);
      importedTaskCount++;
    }

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      importedTaskCount,
      importedColumnCount,
      message: `Successfully imported ${importedTaskCount} tasks and ${importedColumnCount} columns`,
    });
  } catch (error) {
    console.error("Error importing board data:", error);
    return NextResponse.json(
      {
        error: "Failed to import board data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
