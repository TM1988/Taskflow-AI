// app/api/columns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

// Get a specific column
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const columnId = params.id;
    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    if (!mongoDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    const column = await mongoDb
      .collection("columns")
      .findOne({ _id: new ObjectId(columnId) });

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: column._id.toString(),
      name: column.name,
      projectId: column.projectId.toString(),
      order: column.order,
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching column:", error);
    return NextResponse.json(
      { error: "Failed to fetch column" },
      { status: 500 },
    );
  }
}

// Update a column
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid column ID" }, { status: 400 });
    }

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    const result = await mongoDb.collection("columns").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const updatedColumn = await mongoDb.collection("columns").findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      ...updatedColumn,
      id: updatedColumn?._id.toString()
    });
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
  }
}

// Delete a column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid column ID" }, { status: 400 });
    }

    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    const result = await mongoDb.collection("columns").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}
