import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required for personal task export" },
        { status: 400 }
      );
    }

    console.log("Personal Export API: Exporting data for user:", userId);

    // Get user database connection
    const db = await getUserDatabaseConnection(userId);
    
    // Fetch personal columns
    const columnsSnapshot = await db
      .collection("personalColumns")
      .find({ userId })
      .sort({ order: 1 })
      .toArray();

    const columns = columnsSnapshot.map((doc: any) => ({
      id: doc._id.toString(),
      name: doc.name,
      order: doc.order,
      userId: doc.userId,
    }));

    // If no columns exist, use default columns
    if (columns.length === 0) {
      columns.push(
        { id: "todo", name: "To Do", order: 0, userId },
        { id: "in-progress", name: "In Progress", order: 1, userId },
        { id: "review", name: "Review", order: 2, userId },
        { id: "done", name: "Done", order: 3, userId }
      );
    }

    // Fetch personal tasks
    const tasksSnapshot = await db
      .collection("personalTasks")
      .find({ userId })
      .sort({ order: 1 })
      .toArray();

    const tasks = tasksSnapshot.map((doc: any) => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description || "",
      columnId: doc.columnId || "todo",
      status: doc.status || "todo",
      priority: doc.priority || "medium",
      order: doc.order || 0,
      isBlocked: doc.isBlocked || false,
      dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
      userId: doc.userId,
      tags: doc.tags || [],
      assignedTo: doc.assignedTo || [],
    }));

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        userId,
        type: "personal",
        version: "1.0.0"
      },
      columns,
      tasks
    };

    console.log(`Personal Export API: Successfully exported ${columns.length} columns and ${tasks.length} tasks`);

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Personal Export API error:", error);
    return NextResponse.json(
      { error: "Failed to export personal data" },
      { status: 500 }
    );
  }
}
