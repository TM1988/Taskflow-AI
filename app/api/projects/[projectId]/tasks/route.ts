import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    console.log(`Fetching tasks for project: ${projectId}`);

    // Get tasks for this project
    const tasksQuery = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${tasks.length} tasks for project ${projectId}`);

    return NextResponse.json(tasks);

  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { title, description, assigneeId, priority, dueDate, status, createdBy } = body;

    if (!title || !createdBy) {
      return NextResponse.json(
        { error: "Title and creator ID are required" },
        { status: 400 }
      );
    }

    console.log(`Creating task in project: ${projectId}`);

    // Create the task
    const taskData = {
      title: title.trim(),
      description: description?.trim() || "",
      projectId,
      assigneeId: assigneeId || null,
      priority: priority || "medium",
      status: status || "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const taskRef = await addDoc(collection(db, "tasks"), taskData);

    const newTask = {
      id: taskRef.id,
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`Task created successfully: ${taskRef.id}`);

    return NextResponse.json(newTask);

  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
