import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const taskId = params.taskId;
  console.log("[API] Fetching task details for ID:", taskId);

  if (!taskId) {
    console.log("[API] No taskId provided");
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Get the task document
    const task = await adminDb
      .collection("tasks")
      .findOne({ _id: new ObjectId(taskId) });

    if (!task) {
      console.log(`[API] Task ${taskId} not found`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log(`[API] Successfully fetched task ${taskId}`);

    // Transform MongoDB document to expected format
    const processedData = {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      projectId: task.projectId.toString(),
      columnId: task.columnId.toString(),
      status: task.status,
      priority: task.priority,
      order: task.order,
      isBlocked: task.isBlocked,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt ? task.createdAt.toISOString() : null,
      updatedAt: task.updatedAt ? task.updatedAt.toISOString() : null,
    };

    return NextResponse.json(processedData);
  } catch (error) {
    console.error("[API] Error fetching task details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch task details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
