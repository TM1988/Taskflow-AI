import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const columnId = searchParams.get("columnId");

  if (!projectId && !columnId) {
    return NextResponse.json(
      { error: "Project ID or Column ID is required" },
      { status: 400 },
    );
  }

  try {
    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    let tasks;
    if (projectId) {
      tasks = await adminDb
        .collection("tasks")
        .find({ projectId: new ObjectId(projectId) })
        .sort({ order: 1 })
        .toArray();
    } else if (columnId) {
      tasks = await adminDb
        .collection("tasks")
        .find({ columnId: new ObjectId(columnId) })
        .sort({ order: 1 })
        .toArray();
    }

    // Transform to expected format
    const transformedTasks = tasks?.map(task => ({
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
    }));

    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    const taskData = {
      title: data.title,
      description: data.description || "",
      projectId: new ObjectId(data.projectId),
      columnId: new ObjectId(data.columnId),
      status: data.status || "todo",
      priority: data.priority || "medium",
      order: data.order || 0,
      isBlocked: data.isBlocked || false,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await adminDb.collection("tasks").insertOne(taskData);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...data,
      createdAt: taskData.createdAt.toISOString(),
      updatedAt: taskData.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
