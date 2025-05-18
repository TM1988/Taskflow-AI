import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/services/projects/projectService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get projects server-side using projectService
    const userProjects = await projectService.getUserProjects(userId);
    return NextResponse.json(userProjects);
  } catch (error) {
    console.error("Error fetching projects for analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}
