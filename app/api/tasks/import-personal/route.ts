import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required for personal task import" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Personal Import API: Importing data for user:", userId);
    console.log("Personal Import API: Received data:", { 
      hasColumns: !!body.columns, 
      hasTasks: !!body.tasks,
      isArray: Array.isArray(body)
    });

    // Get user database connection
    const db = await getUserDatabaseConnection(userId);

    let importedTaskCount = 0;
    let importedColumnCount = 0;

    // Handle both old format (array of tasks) and new format (object with columns and tasks)
    let tasksToImport: any[] = [];
    let columnsToImport: any[] = [];

    if (Array.isArray(body)) {
      // Old format: just an array of tasks
      tasksToImport = body;
    } else if (body.tasks || body.columns) {
      // New format: object with tasks and columns
      tasksToImport = body.tasks || [];
      columnsToImport = body.columns || [];
    } else {
      return NextResponse.json(
        { error: "Invalid import format" },
        { status: 400 }
      );
    }

    // Import columns if provided
    if (columnsToImport.length > 0) {
      for (const column of columnsToImport) {
        // Check if column already exists
        const existingColumn = await db
          .collection("personalColumns")
          .findOne({ name: column.name, userId });

        if (!existingColumn) {
          const columnDoc = {
            name: column.name,
            order: column.order || 0,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.collection("personalColumns").insertOne(columnDoc);
          importedColumnCount++;
        }
      }
    }

    // Import tasks
    if (tasksToImport.length > 0) {
      // Get the current max order to append new tasks
      const maxOrderTask = await db
        .collection("personalTasks")
        .findOne({ userId }, { sort: { order: -1 } });

      let nextOrder = (maxOrderTask?.order || 0) + 1;

      for (const task of tasksToImport) {
        const taskDoc = {
          title: task.title || "Untitled Task",
          description: task.description || "",
          columnId: task.columnId || "todo",
          status: task.status || task.columnId || "todo",
          priority: task.priority || "medium",
          order: task.order !== undefined ? task.order : nextOrder++,
          isBlocked: task.isBlocked || false,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: new Date(),
          userId,
          tags: task.tags || [],
          assignedTo: task.assignedTo || [],
        };

        // Don't include _id field, let MongoDB generate it
        delete (taskDoc as any)._id;

        const result = await db.collection("personalTasks").insertOne(taskDoc);
        importedTaskCount++;
        console.log("Personal Import API: Inserted task:", taskDoc.title, "for user:", userId, "with ID:", result.insertedId);
      }
    }

    const result = {
      importedTaskCount,
      importedColumnCount,
      message: `Successfully imported ${importedTaskCount} tasks${importedColumnCount > 0 ? ` and ${importedColumnCount} columns` : ''}`,
    };

    console.log("Personal Import API: Import completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Personal Import API error:", error);
    return NextResponse.json(
      { error: "Failed to import personal data" },
      { status: 500 }
    );
  }
}
