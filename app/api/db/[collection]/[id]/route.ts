import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; id: string } },
) {
  try {
    const { collection: collectionName, id } = params;
    
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const collection = adminDb.collection(collectionName);
    
    // Try to find by ObjectId if valid, otherwise try string ID
    let doc;
    
    if (isValidObjectId(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) });
    }
    
    // If not found with ObjectId, try with string ID as fallback
    if (!doc) {
      try {
        // Using any to bypass TypeScript's type checking for this specific case
        doc = await collection.findOne({ _id: id as any });
      } catch (err) {
        console.log("Error finding by string ID:", err);
      }
    }
    
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { collection: string; id: string } },
) {
  try {
    const { collection: collectionName, id } = params;
    const data = await request.json();
    
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const collection = adminDb.collection(collectionName);
    
    if (data._isSetOperation) {
      // Set operation (upsert)
      delete data._isSetOperation;
      const documentData = {
        ...data,
        _id: new ObjectId(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await collection.replaceOne(
        { _id: new ObjectId(id) },
        documentData,
        { upsert: true }
      );
    } else {
      // Update operation
      const updateData = {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      };

      await collection.updateOne({ _id: new ObjectId(id) }, updateData);
    }

    const updatedDoc = await collection.findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      id: updatedDoc?._id.toString(),
      ...updatedDoc,
      _id: undefined,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { collection: string; id: string } },
) {
  try {
    const { collection: collectionName, id } = params;
    
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const collection = adminDb.collection(collectionName);
    
    // Try ObjectId if valid, otherwise try string ID as fallback
    let result;
    
    if (isValidObjectId(id)) {
      result = await collection.deleteOne({ _id: new ObjectId(id) });
    } else {
      try {
        // This is a fallback but may cause type errors with strict MongoDB typing
        // Using any to bypass TypeScript's type checking for this specific case
        result = await collection.deleteOne({ _id: id as any });
      } catch (err) {
        console.log("Error deleting by string ID:", err);
        result = { deletedCount: 0 };
      }
    }
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
