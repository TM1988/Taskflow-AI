import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/admin/mongoAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    const db = await getAdminDb();
    
    // Get user settings or create default
    const userSettings = await db.collection('userSettings')
      .findOne({ userId: userId });
      
    if (userSettings) {
      return NextResponse.json(userSettings.tags || []);
    } else {
      // Return default personal tags
      const defaultTags = ['personal', 'work', 'urgent', 'low-priority', 'health', 'learning'];
      return NextResponse.json(defaultTags);
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
    
    const db = await getAdminDb();
    
    // Update user settings with new tags
    await db.collection('userSettings')
      .updateOne(
        { userId: userId },
        { $set: { tags } },
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
