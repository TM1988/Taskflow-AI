import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;
    const data = await request.json();

    // Log the data being received
    console.log("Task update request:", { taskId, data });

    // Validate input
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    // Check if task exists
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Only include fields that are provided
    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (data.columnId !== undefined) {
      updateData.columnId = data.columnId;
    }

    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    // Always update the last modified timestamp
    updateData.updatedAt = new Date();

    // Perform the update
    await taskRef.update(updateData);

    // Return success response with updated data
    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      id: taskId,
      ...updateData,
      // Format dates for JSON
      dueDate: updateData.dueDate ? updateData.dueDate.toISOString() : null,
      updatedAt: updateData.updatedAt.toISOString(),
    });
  } catch (error) {
    // Log the full error
    console.error("Error updating task:", error);

    // Return detailed error information
    return NextResponse.json(
      {
        error: "Failed to update task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
