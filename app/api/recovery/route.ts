import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { mongoDb } = await getMongoDb();
    
    // Get soft-deleted items
    const query: any = {
      deletedAt: { $exists: true },
      expiresAt: { $gt: new Date() }, // Only items that haven't expired
      $or: [
        { ownerId: userId },
        { "members": { $in: [userId] } },
        ...(organizationId ? [{ organizationId }] : [])
      ]
    };

    const [deletedTasks, deletedProjects, deletedOrganizations] = await Promise.all([
      mongoDb.collection("tasks").find({ ...query, type: { $exists: false } }).toArray(),
      mongoDb.collection("projects").find({ ...query, type: { $exists: false } }).toArray(),
      mongoDb.collection("organizations").find({ ...query, type: { $exists: false } }).toArray()
    ]);

    const items = [
      ...deletedTasks.map(task => ({
        id: task._id.toString(),
        type: 'task',
        name: task.title || 'Untitled Task',
        deletedAt: task.deletedAt,
        expiresAt: task.expiresAt,
        originalData: task
      })),
      ...deletedProjects.map(project => ({
        id: project._id.toString(),
        type: 'project',
        name: project.name || 'Untitled Project',
        deletedAt: project.deletedAt,
        expiresAt: project.expiresAt,
        originalData: project
      })),
      ...deletedOrganizations.map(org => ({
        id: org._id.toString(),
        type: 'organization',
        name: org.name || 'Untitled Organization',
        deletedAt: org.deletedAt,
        expiresAt: org.expiresAt,
        originalData: org
      }))
    ];

    // Sort by deletion date (newest first)
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching deleted items:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted items" },
      { status: 500 }
    );
  }
}
