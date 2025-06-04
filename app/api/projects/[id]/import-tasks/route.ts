import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { tasks } = body;

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: "Tasks array is required" }, { status: 400 });
    }

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    // Prepare tasks for insertion with proper structure
    const tasksToInsert = tasks.map((task, index) => ({
      title: task.title || `Imported Task ${index + 1}`,
      description: task.description || "",
      priority: task.priority || "medium",
      columnId: task.columnId || task.status || "todo", // Handle both columnId and status
      projectId: projectId,
      assignee: task.assignee || null,
      assigneeName: task.assigneeName || task.assignee || null,
      tags: task.tags || [],
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      order: task.order || index,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Remove any existing ids
      _id: undefined,
      id: undefined
    }));

    console.log("Inserting tasks:", tasksToInsert);

    // Insert tasks into MongoDB
    const result = await mongoDb.collection("tasks").insertMany(tasksToInsert);
    
    console.log(`Imported ${result.insertedCount} tasks to MongoDB`);

    // Verify tasks were inserted
    const verifyTasks = await mongoDb.collection("tasks").find({ projectId }).toArray();
    console.log(`Total tasks in project after import: ${verifyTasks.length}`);

    return NextResponse.json({ 
      success: true, 
      importedCount: result.insertedCount,
      totalTasks: verifyTasks.length,
      message: `Successfully imported ${result.insertedCount} tasks`
    });

  } catch (error) {
    console.error("Error importing tasks:", error);
    return NextResponse.json(
      { error: "Failed to import tasks" },
      { status: 500 }
    );
  }
}
