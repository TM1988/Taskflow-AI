import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const taskId = params.taskId;
  console.log("[API] Board API fetching task details for ID:", taskId);

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

    // Ensure all dates are serialized correctly
    const serializedData = {
      ...taskData,
      id: taskDoc.id,
    };

    // Convert Firestore timestamps to ISO strings
    ["createdAt", "updatedAt", "dueDate"].forEach((field) => {
      if (serializedData[field]) {
        if (typeof serializedData[field].toDate === "function") {
          serializedData[field] = serializedData[field].toDate().toISOString();
        } else if (serializedData[field] instanceof Date) {
          serializedData[field] = serializedData[field].toISOString();
        }
      }
    });

    return NextResponse.json(serializedData);
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
