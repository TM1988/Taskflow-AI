import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  try {
    const collectionName = params.collection;
    const { searchParams } = request.nextUrl;
    
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const collection = adminDb.collection(collectionName);
    
    // Build filter from where conditions
    const filter: any = {};
    const whereParam = searchParams.get('where');
    if (whereParam) {
      const whereConditions = JSON.parse(whereParam);
      whereConditions.forEach(([field, operator, value]: [string, string, any]) => {
        switch (operator) {
          case "==":
            filter[field] = value;
            break;
          case "!=":
            filter[field] = { $ne: value };
            break;
          case ">":
            filter[field] = { $gt: value };
            break;
          case ">=":
            filter[field] = { $gte: value };
            break;
          case "<":
            filter[field] = { $lt: value };
            break;
          case "<=":
            filter[field] = { $lte: value };
            break;
          case "array-contains":
            filter[field] = { $in: [value] };
            break;
          case "in":
            filter[field] = { $in: value };
            break;
        }
      });
    }

    // Build sort
    const sort: any = {};
    const orderBy = searchParams.get('orderBy');
    const orderDirection = searchParams.get('orderDirection');
    if (orderBy) {
      sort[orderBy] = orderDirection === 'desc' ? -1 : 1;
    }

    const cursor = collection.find(filter);
    if (Object.keys(sort).length > 0) {
      cursor.sort(sort);
    }

    const docs = await cursor.toArray();
    const transformedDocs = docs.map(doc => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    }));

    return NextResponse.json(transformedDocs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  try {
    const collectionName = params.collection;
    const data = await request.json();
    
    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    const collection = adminDb.collection(collectionName);
    
    const documentData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(documentData);
    const newDoc = await collection.findOne({ _id: result.insertedId });
    
    return NextResponse.json({
      id: newDoc?._id.toString(),
      ...newDoc,
      _id: undefined,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}
