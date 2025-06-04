import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    if (!params.id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const { mongoDb } = await getMongoDb(); // Added await here

    if (!mongoDb) {
      throw new Error("MongoDB not initialized");
    }

    // Get all columns for the project
    const columns = await mongoDb
      .collection("columns")
      .find({ projectId: params.id })
      .sort({ order: 1 })
      .toArray();

    // Transform columns to the required format
    const transformedColumns = columns.map(col => ({
      id: col._id.toString(),
      ...col,
      _id: undefined,
    }));

    // Get all tasks for the project
    const tasks = await mongoDb
      .collection("tasks")
      .find({ projectId: params.id })
      .toArray();

    // Transform tasks to the required format
    const transformedTasks = tasks.map(task => ({
      id: task._id.toString(),
      ...task,
      _id: undefined,
      // Convert MongoDB dates to Firestore timestamp format for compatibility
      createdAt: task.createdAt ? {
        _seconds: Math.floor(task.createdAt.getTime() / 1000),
        _nanoseconds: (task.createdAt.getTime() % 1000) * 1000000
      } : undefined,
      updatedAt: task.updatedAt ? {
        _seconds: Math.floor(task.updatedAt.getTime() / 1000),
        _nanoseconds: (task.updatedAt.getTime() % 1000) * 1000000
      } : undefined,
    }));

    // Get project details
    const project = await mongoDb.collection("projects").findOne({ _id: new ObjectId(params.id) });
    
    // Create the export object with metadata
    const exportData = {
      metadata: {
        exportedAt: new Date(),
        projectId: params.id,
        projectName: project?.name || "Unknown Project",
        version: "1.0"
      },
      columns: transformedColumns,
      tasks: transformedTasks
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting board data:", error);
    return NextResponse.json(
      { error: "Failed to export board data" },
      { status: 500 },
    );
  }
}
