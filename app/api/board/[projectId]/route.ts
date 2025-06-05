// app/api/board/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    
    console.log("=== BOARD API CALLED ===");
    console.log("Project ID:", projectId);

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    // Fetch tasks directly from tasks collection for this specific project
    const tasks = await mongoDb
      .collection("tasks")
      .find({ projectId: projectId })
      .toArray();

    console.log(`Found ${tasks.length} tasks for project ${projectId}`);

    // Format tasks for the board
    const formattedTasks = tasks.map((task: any) => ({
      ...task,
      id: task._id.toString(),
      _id: undefined,
      columnId: task.columnId || task.status || 'todo', // Add default columnId
    }));

    // Group tasks by columnId for the board structure
    const board: Record<string, { tasks: any[] }> = {};
    
    formattedTasks.forEach(task => {
      const columnId = task.columnId || 'todo';
      if (!board[columnId]) {
        board[columnId] = { tasks: [] };
      }
      board[columnId].tasks.push(task);
    });

    console.log("Board structure:", Object.keys(board));
    
    return NextResponse.json({
      board,
      columns: [] // Will be fetched separately
    });

  } catch (error) {
    console.error("Error fetching board data:", error);
    return NextResponse.json(
      { error: "Failed to fetch board data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const taskData = await request.json();
    
    console.log("=== CREATING TASK ===");
    console.log("Project ID:", projectId);
    console.log("Task data:", taskData);

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();

    // Validate required fields
    if (!taskData.title || !taskData.columnId) {
      return NextResponse.json(
        { error: "Title and column ID are required" },
        { status: 400 }
      );
    }

    // Get the highest order for the column to append at the end
    const existingTasks = await mongoDb
      .collection("tasks")
      .find({ projectId, columnId: taskData.columnId })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const nextOrder = existingTasks.length > 0 ? (existingTasks[0].order || 0) + 1 : 0;

    // Create the task document
    const newTask = {
      title: taskData.title,
      description: taskData.description || "",
      projectId: projectId,
      columnId: taskData.columnId,
      priority: taskData.priority || "medium",
      status: taskData.status || "todo",
      order: nextOrder,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Inserting task:", newTask);

    // Insert the task
    const result = await mongoDb.collection("tasks").insertOne(newTask);

    // Return the created task with proper ID format
    const createdTask = {
      ...newTask,
      id: result.insertedId.toString(),
      _id: undefined,
      dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
    };

    console.log("Task created successfully:", createdTask);

    return NextResponse.json(createdTask, { status: 201 });

  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
