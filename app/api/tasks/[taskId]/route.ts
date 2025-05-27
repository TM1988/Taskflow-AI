import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;
    const data = await request.json();

    console.log("Task update request:", { taskId, data });

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Check if task exists
    const existingTask = await adminDb
      .collection("tasks")
      .findOne({ _id: new ObjectId(taskId) });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Only include fields that are provided
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    
    // Keep columnId as string - don't convert to ObjectId
    if (data.columnId !== undefined) {
      updateData.columnId = data.columnId;
      console.log(`Setting columnId as string: ${data.columnId}`);
    }
    
    if (data.order !== undefined) updateData.order = data.order;

    // Always update the last modified timestamp
    updateData.updatedAt = new Date();

    console.log("Final update data:", updateData);

    // Perform the update
    const result = await adminDb
      .collection("tasks")
      .updateOne({ _id: new ObjectId(taskId) }, { $set: updateData });

    console.log("Update result:", result);

    // Return success response with updated data
    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      id: taskId,
      modifiedCount: result.modifiedCount,
      columnId: data.columnId, // Return the string format
      updatedAt: updateData.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating task:", error);

    return NextResponse.json(
      {
        error: "Failed to update task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
