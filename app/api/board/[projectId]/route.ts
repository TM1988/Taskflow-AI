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
