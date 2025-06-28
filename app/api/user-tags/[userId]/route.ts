import { NextRequest, NextResponse } from 'next/server';
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (userId === 'current') {
      return NextResponse.json({ error: 'Current user not implemented' }, { status: 400 });
    }
    
    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }
    
    // Get user custom tags
    const userSettings = await database.collection('userSettings')
      .findOne({ userId: userId });
      
    if (userSettings && userSettings.tags) {
      return NextResponse.json(userSettings.tags);
    } else {
      // Return empty array - no default tags
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching user tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user tags' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }
    
    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }
    
    // Update user settings with new tags
    await database.collection('userSettings')
      .updateOne(
        { userId: userId },
        { 
          $set: { 
            tags,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error updating user tags:', error);
    return NextResponse.json(
      { error: 'Failed to update user tags' },
      { status: 500 }
    );
  }
}
