// app/api/columns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

// Get columns for a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
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

    const columns = await adminDb
      .collection("columns")
      .find({ projectId: new ObjectId(projectId) })
      .sort({ order: 1 })
      .toArray();

    const transformedColumns = columns.map(col => ({
      id: col._id.toString(),
      name: col.name,
      projectId: col.projectId.toString(),
      order: col.order,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    }));

    return NextResponse.json(transformedColumns);
  } catch (error) {
    console.error("Error fetching columns:", error);
    return NextResponse.json(
      { error: "Failed to fetch columns" },
      { status: 500 },
    );
  }
}

// Create a new column
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.projectId || !data.name) {
      return NextResponse.json(
        { error: "Project ID and name are required" },
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

    // Get the max order value to place this column at the end
    const columns = await adminDb
      .collection("columns")
      .find({ projectId: new ObjectId(data.projectId) })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const maxOrder = columns.length > 0 ? (columns[0].order || 0) + 1 : 0;

    const columnData = {
      name: data.name,
      projectId: new ObjectId(data.projectId),
      order: data.order !== undefined ? data.order : maxOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await adminDb.collection("columns").insertOne(columnData);

    return NextResponse.json({
      id: result.insertedId.toString(),
      name: columnData.name,
      projectId: data.projectId,
      order: columnData.order,
      createdAt: columnData.createdAt,
      updatedAt: columnData.updatedAt,
    });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 },
    );
  }
}
