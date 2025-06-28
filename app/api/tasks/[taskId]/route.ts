import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getAdminDb, getOrganizationDatabaseConnection } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;
    const data = await request.json(); // data contains { ...taskFields, userId, organizationId, projectId }

    console.log("[PUT /api/tasks/[taskId]] Request data:", { taskId, data });

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    let database;
    let isOrgTask = false;

    // Prioritize organizationId if provided
    if (data.organizationId) {
      console.log(`[PUT /api/tasks/[taskId]] Using organization DB for org: ${data.organizationId}`);
      database = await getOrganizationDatabaseConnection(data.organizationId);
      isOrgTask = true;
    } else if (data.userId && !data.projectId) { // Personal task (no project)
      console.log(`[PUT /api/tasks/[taskId]] Using user DB for user (personal task): ${data.userId}`);
      database = await getUserDatabaseConnection(data.userId);
    } else if (data.userId && data.projectId) { // Could be a personal project task
      console.log(`[PUT /api/tasks/[taskId]] Using user DB for user (personal project task): ${data.userId}, project: ${data.projectId}`);
      database = await getUserDatabaseConnection(data.userId);
    } else {
      // Fallback or if context is unclear - this might need refinement
      console.warn(`[PUT /api/tasks/[taskId]] Falling back to admin DB (taskId: ${taskId}). Context: userId=${data.userId}, orgId=${data.organizationId}, projId=${data.projectId}`);
      database = await getAdminDb();
    }
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Determine the correct collection
    const collectionName = isOrgTask ? "tasks" : (data.projectId === "personal" || (!data.projectId && !data.organizationId) ? "personalTasks" : "tasks");
    console.log(`[PUT /api/tasks/[taskId]] Attempting update in collection: ${collectionName}`);

    // Check if task exists
    let existingTask;
    try {
      existingTask = await database
        .collection(collectionName)
        .findOne({ _id: new ObjectId(taskId) });
    } catch (e) {
      return NextResponse.json({ error: "Invalid Task ID format" }, { status: 400 });
    }

    if (!existingTask) {
      // If not found, and it was an org task attempt, don't try personal.
      // If it was a personal attempt, and not found, then it's truly not found.
      console.log(`[PUT /api/tasks/[taskId]] Task ${taskId} not found in ${collectionName}`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.columnId !== undefined) updateData.columnId = data.columnId;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.status !== undefined) updateData.status = data.status; // Added status
    if (data.isBlocked !== undefined) updateData.isBlocked = data.isBlocked; // Added isBlocked
    if (data.tags !== undefined) updateData.tags = data.tags; // Added tags

    // If it's an organization task, ensure projectId is part of the update if provided
    // This typically shouldn't change, but good for completeness if other fields are updated.
    if (isOrgTask && data.projectId && existingTask.projectId !== data.projectId) {
        // Generally, a task's project shouldn't change on a simple update.
        // If this is a desired feature, it needs careful handling.
        // For now, we'll assume projectId doesn't change or is correctly passed.
        // updateData.projectId = data.projectId; 
    }


    if (Object.keys(updateData).length === 0) {
      // No actual fields to update other than updatedAt
      // Return the existing task or a message indicating no changes
      // For now, we'll proceed to update `updatedAt`
       console.log("[PUT /api/tasks/[taskId]] No updatable fields provided, only updating timestamp.");
    }
    
    updateData.updatedAt = new Date();

    console.log("[PUT /api/tasks/[taskId]] Final update data:", updateData);

    const result = await database
      .collection(collectionName)
      .updateOne({ _id: new ObjectId(taskId) }, { $set: updateData });

    console.log("[PUT /api/tasks/[taskId]] Update result:", result);

    if (result.matchedCount === 0) {
        // Should have been caught by existingTask check, but as a safeguard
        return NextResponse.json({ error: "Task not found during update operation" }, { status: 404 });
    }

    const updatedTaskDoc = await database
      .collection(collectionName)
      .findOne({ _id: new ObjectId(taskId) });

    if (!updatedTaskDoc) {
      return NextResponse.json(
        { error: "Task not found after update" },
        { status: 404 },
      );
    }

    // Ensure all fields from updatedTaskDoc are spread first
    const formattedTask: any = {
      ...updatedTaskDoc,
      id: updatedTaskDoc._id.toString(),
      _id: undefined, // Remove _id to prefer id
      // Ensure dates are ISO strings
      dueDate: updatedTaskDoc.dueDate ? new Date(updatedTaskDoc.dueDate).toISOString() : null,
      createdAt: updatedTaskDoc.createdAt ? new Date(updatedTaskDoc.createdAt).toISOString() : null,
      updatedAt: updatedTaskDoc.updatedAt ? new Date(updatedTaskDoc.updatedAt).toISOString() : null,
    };
    
    // If it's a personal task and projectId is not set, ensure it's "personal"
    if (!isOrgTask && !formattedTask.projectId && collectionName === "personalTasks") {
        formattedTask.projectId = "personal";
    }


    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task: formattedTask,
      modifiedCount: result.modifiedCount,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');

    console.log(`[DELETE /api/tasks/[taskId]] Deleting task: ${taskId}, userId: ${userId}, orgId: ${organizationId}, projId: ${projectId}`);

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    let database;
    let isOrgTask = false;

    // Prioritize organizationId if provided
    if (organizationId) {
      console.log(`[DELETE /api/tasks/[taskId]] Using organization DB for org: ${organizationId}`);
      database = await getOrganizationDatabaseConnection(organizationId);
      isOrgTask = true;
    } else if (userId && !projectId) { // Personal task (no project)
      console.log(`[DELETE /api/tasks/[taskId]] Using user DB for user (personal task): ${userId}`);
      database = await getUserDatabaseConnection(userId);
    } else if (userId && projectId) { // Could be a personal project task
      console.log(`[DELETE /api/tasks/[taskId]] Using user DB for user (personal project task): ${userId}, project: ${projectId}`);
      database = await getUserDatabaseConnection(userId);
    } else {
      // Fallback
      console.warn(`[DELETE /api/tasks/[taskId]] Falling back to admin DB (taskId: ${taskId}). Context: userId=${userId}, orgId=${organizationId}, projId=${projectId}`);
      database = await getAdminDb();
    }
    
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Determine the correct collection
    const collectionName = isOrgTask ? "tasks" : (projectId === "personal" || (!projectId && !organizationId) ? "personalTasks" : "tasks");
    console.log(`[DELETE /api/tasks/[taskId]] Attempting deletion from collection: ${collectionName}`);

    // Check if task exists
    let existingTask;
    try {
      existingTask = await database
        .collection(collectionName)
        .findOne({ _id: new ObjectId(taskId) });
    } catch (e) {
      return NextResponse.json({ error: "Invalid Task ID format" }, { status: 400 });
    }

    if (!existingTask) {
      console.log(`[DELETE /api/tasks/[taskId]] Task ${taskId} not found in ${collectionName}`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log(`[DELETE /api/tasks/[taskId]] Found task to delete: ${existingTask.title}`);

    // Delete the task
    const result = await database
      .collection(collectionName)
      .deleteOne({ _id: new ObjectId(taskId) });

    console.log(`[DELETE /api/tasks/[taskId]] Delete result:`, result);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found during deletion operation" }, { status: 404 });
    }

    // Also delete any comments associated with this task
    try {
      const commentsResult = await database
        .collection("comments")
        .deleteMany({ taskId: new ObjectId(taskId) });
      console.log(`[DELETE /api/tasks/[taskId]] Deleted ${commentsResult.deletedCount} comments for task ${taskId}`);
    } catch (error) {
      console.error(`[DELETE /api/tasks/[taskId]] Error deleting comments:`, error);
      // Don't fail the whole operation if comment deletion fails
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(`[DELETE /api/tasks/[taskId]] Error deleting task:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
