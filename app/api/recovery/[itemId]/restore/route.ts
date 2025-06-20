import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    const { mongoDb } = await getMongoDb();

    // Find the item in different collections
    let item = null;
    let collection = null;

    // Try tasks first
    item = await mongoDb.collection("tasks").findOne({ _id: new ObjectId(itemId) });
    if (item) collection = "tasks";

    // Try projects if not found
    if (!item) {
      item = await mongoDb.collection("projects").findOne({ _id: new ObjectId(itemId) });
      if (item) collection = "projects";
    }

    // Try organizations if not found
    if (!item) {
      item = await mongoDb.collection("organizations").findOne({ _id: new ObjectId(itemId) });
      if (item) collection = "organizations";
    }

    if (!item || !collection) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!item.deletedAt) {
      return NextResponse.json({ error: "Item is not deleted" }, { status: 400 });
    }

    // Check if item has expired
    if (new Date() > new Date(item.expiresAt)) {
      return NextResponse.json({ error: "Item has expired and cannot be recovered" }, { status: 400 });
    }

    // Remove deletion fields to restore the item
    await mongoDb.collection(collection).updateOne(
      { _id: new ObjectId(itemId) },
      {
        $unset: {
          deletedAt: "",
          expiresAt: "",
          deletedBy: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true, message: "Item recovered successfully" });
  } catch (error) {
    console.error("Error recovering item:", error);
    return NextResponse.json(
      { error: "Failed to recover item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    const { mongoDb } = await getMongoDb();

    // Find and permanently delete the item from all collections
    const collections = ["tasks", "projects", "organizations"];
    let deleted = false;

    for (const collectionName of collections) {
      const result = await mongoDb.collection(collectionName).deleteOne({
        _id: new ObjectId(itemId)
      });
      
      if (result.deletedCount > 0) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting item:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete item" },
      { status: 500 }
    );
  }
}
