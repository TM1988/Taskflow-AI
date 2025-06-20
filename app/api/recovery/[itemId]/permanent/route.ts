import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

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
