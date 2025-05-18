import { NextRequest, NextResponse } from "next/server";
import { taskService, CreateTaskDTO } from "@/services/tasks/taskService";

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
    let tasks;
    if (projectId) {
      tasks = await taskService.getProjectTasks(projectId);
    } else if (columnId) {
      tasks = await taskService.getColumnTasks(columnId as string);
    }
    return NextResponse.json(tasks);
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
    const data: CreateTaskDTO = await request.json();
    const task = await taskService.createTask(data);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
