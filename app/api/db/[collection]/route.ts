import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Helper function to check if user has enabled organizations in custom DB
async function isOrganizationsEnabledForUser(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const databaseConfig = userData.databaseConfig;
      return databaseConfig?.includeOrganizations === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking organizations setting:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  try {
    const collectionName = params.collection;
    
    const { searchParams } = request.nextUrl;
    
    // Get user ID from query parameters
    const userId = searchParams.get('userId');
    
    // Check allowed collections based on user configuration
    let allowedCollections = ['tasks', 'columns', 'comments'];
    
    if (userId && collectionName === 'organizations') {
      const organizationsEnabled = await isOrganizationsEnabledForUser(userId);
      if (organizationsEnabled) {
        allowedCollections.push('organizations');
      }
    }
    
    if (!allowedCollections.includes(collectionName)) {
      return NextResponse.json(
        { error: `Collection '${collectionName}' is not allowed. Available collections: ${allowedCollections.join(', ')}. To store organizations in your custom database, enable the option in settings.` },
        { status: 400 }
      );
    }
    
    let database;
    if (userId) {
      // Use user-specific database (custom or official based on their config)
      database = await getUserDatabaseConnection(userId);
    } else {
      // Fallback to admin database
      database = await getAdminDb();
    }
    
    if (!database) {
      throw new Error("Database not initialized");
    }

    const collection = database.collection(collectionName);
    
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
    
    // Get user ID from request data or query parameters
    const userId = data.userId || new URL(request.url).searchParams.get('userId');
    
    // Check allowed collections based on user configuration
    let allowedCollections = ['tasks', 'columns', 'comments'];
    
    if (userId && collectionName === 'organizations') {
      const organizationsEnabled = await isOrganizationsEnabledForUser(userId);
      if (organizationsEnabled) {
        allowedCollections.push('organizations');
      }
    }
    
    if (!allowedCollections.includes(collectionName)) {
      return NextResponse.json(
        { error: `Collection '${collectionName}' is not allowed. Available collections: ${allowedCollections.join(', ')}. To store organizations in your custom database, enable the option in settings.` },
        { status: 400 }
      );
    }
    
    let database;
    if (userId) {
      // Use user-specific database (custom or official based on their config)
      database = await getUserDatabaseConnection(userId);
    } else {
      // Fallback to admin database
      database = await getAdminDb();
    }
    
    if (!database) {
      throw new Error("Database not initialized");
    }

    const collection = database.collection(collectionName);
    
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
