// app/api/columns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    console.log("=== COLUMNS API CALLED ===");
    console.log("Project ID:", projectId);

    // Initialize MongoDB first
    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    const columns = await mongoDb
      .collection("columns")
      .find({ projectId })
      .sort({ order: 1 })
      .toArray();

    console.log("Raw columns from MongoDB:", columns.length);

    // Convert ObjectId to string
    const formattedColumns = columns.map(col => ({
      ...col,
      id: col._id.toString(),
      _id: undefined
    }));

    console.log("Formatted columns:", formattedColumns);

    return NextResponse.json(formattedColumns);
  } catch (error) {
    console.error("Error fetching columns:", error);
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, order } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: "Project ID and name are required" }, { status: 400 });
    }

    const { mongoDb } = await getMongoDb();
    
    const newColumn = {
      projectId,
      name,
      order: order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoDb.collection("columns").insertOne(newColumn);
    
    const column = {
      ...newColumn,
      id: result.insertedId.toString()
    };

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { columns } = body;

    if (!columns || !Array.isArray(columns)) {
      return NextResponse.json({ error: "Columns array is required" }, { status: 400 });
    }

    const { mongoDb } = await getMongoDb();
    
    // Update multiple columns
    const bulkOps = columns.map(col => ({
      updateOne: {
        filter: { _id: new ObjectId(col.id) },
        update: {
          $set: {
            name: col.name,
            order: col.order,
            updatedAt: new Date()
          }
        }
      }
    }));

    await mongoDb.collection("columns").bulkWrite(bulkOps);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating columns:", error);
    return NextResponse.json({ error: "Failed to update columns" }, { status: 500 });
  }
}
