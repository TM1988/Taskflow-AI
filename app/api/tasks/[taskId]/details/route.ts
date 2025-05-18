import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

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
    // Get the task document
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      console.log(`[API] Task ${taskId} not found`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get task data
    const taskData = taskDoc.data();
    console.log(`[API] Successfully fetched task ${taskId}`);

    // Process dates to ensure they're serializable
    let processedData = { ...taskData };

    // Handle due date
    if (taskData?.dueDate) {
      if (typeof taskData.dueDate.toDate === "function") {
        processedData.dueDate = taskData.dueDate.toDate().toISOString();
      } else if (taskData.dueDate instanceof Date) {
        processedData.dueDate = taskData.dueDate.toISOString();
      }
    }

    // Handle createdAt
    if (taskData?.createdAt) {
      if (typeof taskData.createdAt.toDate === "function") {
        processedData.createdAt = taskData.createdAt.toDate().toISOString();
      } else if (taskData.createdAt instanceof Date) {
        processedData.createdAt = taskData.createdAt.toISOString();
      }
    }

    // Handle updatedAt
    if (taskData?.updatedAt) {
      if (typeof taskData.updatedAt.toDate === "function") {
        processedData.updatedAt = taskData.updatedAt.toDate().toISOString();
      } else if (taskData.updatedAt instanceof Date) {
        processedData.updatedAt = taskData.updatedAt.toISOString();
      }
    }

    // Return the task data with its ID
    return NextResponse.json({
      id: taskDoc.id,
      ...processedData,
    });
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
