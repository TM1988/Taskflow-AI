// app/api/board/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

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

async function safeFirestoreQuery<T>(
  queryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>,
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error("Firestore query error:", error);

    // Check if it's an index error
    const isIndexError =
      error && typeof error === "object" && "code" in error && error.code === 9;

    if (isIndexError && fallbackFn) {
      console.log("Using fallback query approach due to missing index");
      return await fallbackFn();
    }
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;
    console.log(`Loading board data for project ${projectId}`);

    // First check if project exists
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      console.log(`Project ${projectId} not found, returning 404`);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data();
    console.log(`Project ${projectId} found:`, projectData?.name);

    // Fetch columns
    let columnsSnapshot = await adminDb
      .collection("columns")
      .where("projectId", "==", projectId)
      .orderBy("order", "asc")
      .get();

    // If no columns exist yet, create default columns
    if (columnsSnapshot.empty) {
      console.log(
        `No columns found for project ${projectId}, creating defaults`,
      );
      const defaultColumns = ["To Do", "In Progress", "Review", "Done"];

      // Use batch write for efficiency
      const batch = adminDb.batch();
      const columnRefs = [];

      // Create default columns
      for (let i = 0; i < defaultColumns.length; i++) {
        const columnRef = adminDb.collection("columns").doc();
        columnRefs.push(columnRef);

        batch.set(columnRef, {
          name: defaultColumns[i],
          projectId: projectId,
          order: i,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      console.log(
        `Created ${defaultColumns.length} default columns for project ${projectId}`,
      );

      // Get the newly created columns
      columnsSnapshot = await adminDb
        .collection("columns")
        .where("projectId", "==", projectId)
        .orderBy("order", "asc")
        .get();
    }

    const columns = columnsSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Omit<Column, "id">),
      }),
    ) as Column[];

    console.log(`Found ${columns.length} columns for project ${projectId}`);

    // Fetch tasks for all columns
    const tasksSnapshot = await adminDb
      .collection("tasks")
      .where("projectId", "==", projectId)
      .orderBy("order", "asc")
      .get();

    const tasks = tasksSnapshot.docs.map(
      (doc: FirestoreQueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, "id">),
      }),
    ) as Task[];

    console.log(`Found ${tasks.length} tasks for project ${projectId}`);

    // Build the board structure
    const board: BoardData = {};

    columns.forEach((column) => {
      // Get tasks for this column
      const columnTasks = tasks.filter((task) => task.columnId === column.id);

      // Add to board
      board[column.id] = {
        id: column.id,
        title: column.name,
        tasks: columnTasks,
      };

      console.log(
        `Column ${column.name} (${column.id}) has ${columnTasks.length} tasks`,
      );
    });

    return NextResponse.json({
      columns,
      board,
    });
  } catch (error) {
    console.error("Error loading board data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Failed to load board data",
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 },
    );
  }
}

// Helper method to create a basic task
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const projectId = params.projectId;
    const { title, description, columnId, priority, dueDate } =
      await request.json();

    console.log("Creating task:", {
      title,
      description,
      columnId,
      priority,
      dueDate,
    });

    // Validate required fields
    if (!title || !columnId) {
      return NextResponse.json(
        { error: "Title and columnId are required" },
        { status: 400 },
      );
    }

    // Get the max order value for the column to place this task at the end
    const columnTasks = await adminDb
      .collection("tasks")
      .where("columnId", "==", columnId)
      .orderBy("order", "desc")
      .limit(1)
      .get();

    const maxOrder = columnTasks.empty
      ? 0
      : (columnTasks.docs[0].data().order || 0) + 1;

    // Create the task
    const taskRef = adminDb.collection("tasks").doc();
    const taskData = {
      title,
      description: description || "",
      projectId,
      columnId,
      status: "todo",
      priority: priority || "medium",
      order: maxOrder,
      isBlocked: false,
      // Properly parse the date if provided
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await taskRef.set(taskData);

    console.log(`Task created: ${taskRef.id}`);

    // Return with ID so the board knows the new task
    return NextResponse.json({
      id: taskRef.id,
      ...taskData,
      // Format dates for JSON
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : null,
      createdAt: taskData.createdAt.toISOString(),
      updatedAt: taskData.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating task:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to create task", details: errorMessage },
      { status: 500 },
    );
  }
}
