import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const taskId = params.taskId;
  console.log(`[DIRECT API] Loading task ${taskId}`);

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      console.log(`[DIRECT API] Task ${taskId} not found`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get task data
    const taskData = taskDoc.data();

    // Format the data to be serializable
    const result = {
      id: taskDoc.id,
      ...taskData,
    };

    // Handle date formatting
    ["createdAt", "updatedAt", "dueDate", "completedAt"].forEach((field) => {
      if (result[field] && typeof result[field].toDate === "function") {
        result[field] = result[field].toDate().toISOString();
      }
    });

    // Add a small artificial delay in development to make loading state more visible
    if (process.env.NODE_ENV === "development") {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(`[DIRECT API] Successfully loaded task ${taskId}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[DIRECT API] Error loading task:`, error);
    return NextResponse.json({ error: "Failed to load task" }, { status: 500 });
  }
}
