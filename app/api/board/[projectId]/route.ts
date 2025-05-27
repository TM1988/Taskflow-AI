// app/api/board/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

// Define interfaces for our data models
interface Column {
  id: string;
  name: string;
  projectId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  columnId: string;
  status: string;
  priority: string;
  order: number;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BoardColumn {
  id: string;
  title: string;
  tasks: Task[];
}

interface BoardData {
  [columnId: string]: BoardColumn;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;
    console.log(`Loading board data for project ${projectId}`);

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Convert string ID to ObjectId for MongoDB query
    const project = await adminDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!project) {
      console.log(`Project ${projectId} not found, returning 404`);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    console.log(`Project ${projectId} found:`, project.name);

    // Fetch columns by string projectId
    const columns = await adminDb
      .collection("columns")
      .find({ projectId: projectId })
      .sort({ order: 1 })
      .toArray();

    console.log(`Found ${columns.length} columns for project ${projectId}`);

    // Fetch tasks by string projectId
    const tasks = await adminDb
      .collection("tasks")
      .find({ projectId: projectId })
      .sort({ order: 1 })
      .toArray();

    console.log(`Found ${tasks.length} tasks for project ${projectId}`);

    // Transform to expected format with proper ObjectId to string conversion
    const transformedColumns = columns.map(col => ({
      id: col._id.toString(), // Convert ObjectId to string
      name: col.name,
      projectId: col.projectId,
      order: col.order,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    }));

    const transformedTasks: Task[] = tasks.map(task => ({
      id: task._id.toString(), // Convert ObjectId to string
      title: task.title,
      description: task.description || "",
      projectId: task.projectId,
      columnId: task.columnId, // Make sure this is a string
      status: task.status,
      priority: task.priority,
      order: task.order,
      isBlocked: task.isBlocked,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueDate: task.dueDate,
    }));

    // Build the board structure
    const board: BoardData = {};

    transformedColumns.forEach((column) => {
      const columnTasks = transformedTasks.filter((task) => task.columnId === column.id);

      board[column.id] = {
        id: column.id,
        title: column.name,
        tasks: columnTasks,
      };

      console.log(`Column ${column.name} (${column.id}) has ${columnTasks.length} tasks`);
    });

    return NextResponse.json({
      columns: transformedColumns,
      board,
    });
  } catch (error) {
    console.error("Error loading board data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to load board data",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;
    const { title, description, columnId, priority, dueDate } = await request.json();

    console.log("Creating task:", { title, description, columnId, priority, dueDate });

    // Validate required fields
    if (!title || !columnId) {
      return NextResponse.json(
        { error: "Title and columnId are required" },
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

    // Get the max order value for the column to place this task at the end
    const columnTasks = await adminDb
      .collection("tasks")
      .find({ columnId: new ObjectId(columnId) })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const maxOrder = columnTasks.length > 0 ? (columnTasks[0].order || 0) + 1 : 0;

    // Create the task
    const taskData = {
      title,
      description: description || "",
      projectId: new ObjectId(projectId),
      columnId: new ObjectId(columnId),
      status: "todo",
      priority: priority || "medium",
      order: maxOrder,
      isBlocked: false,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await adminDb.collection("tasks").insertOne(taskData);

    console.log(`Task created: ${result.insertedId}`);

    // Return with ID so the board knows the new task
    return NextResponse.json({
      id: result.insertedId.toString(),
      title,
      description: description || "",
      projectId,
      columnId,
      status: "todo",
      priority: priority || "medium",
      order: maxOrder,
      isBlocked: false,
      dueDate: dueDate || null,
      createdAt: taskData.createdAt.toISOString(),
      updatedAt: taskData.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating task:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to create task", details: errorMessage },
      { status: 500 },
    );
  }
}
