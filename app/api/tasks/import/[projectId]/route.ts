import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;
    const tasks = await request.json();

    const { mongoDb } = await getMongoDb();

    // Verify the project exists
    const projectDoc = await mongoDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!projectDoc) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify columns exist
    const columns = await mongoDb
      .collection("columns")
      .find({ projectId })
      .toArray();

    if (columns.length === 0) {
      return NextResponse.json(
        { error: "No columns found for this project" },
        { status: 400 },
      );
    }

    const columnIds = columns.map(col => col.id || col._id.toString());

    // Process and validate tasks
    const importedTasks = [];

    for (const task of tasks) {
      // If columnId isn't in this project's columns, assign to the first column
      if (!columnIds.includes(task.columnId)) {
        task.columnId = columnIds[0];
      }

      // Always use the current project ID (prevents importing to wrong project)
      task.projectId = projectId;

      // Get the max order for the column
      const columnTasks = await mongoDb
        .collection("tasks")
        .find({ columnId: task.columnId })
        .sort({ order: -1 })
        .limit(1)
        .toArray();

      const maxOrder = columnTasks.length > 0 ? (columnTasks[0].order || 0) + 1 : 0;

      // Create task data
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

      const result = await mongoDb.collection("tasks").insertOne(taskData);
      importedTasks.push({
        id: result.insertedId.toString(),
        ...taskData,
      });
    }

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
