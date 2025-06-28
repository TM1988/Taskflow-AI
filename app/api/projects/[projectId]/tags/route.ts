import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/admin/mongoAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    
    const db = await getAdminDb();
    
    // Get project settings or create default
    const projectSettings = await db.collection('projectSettings')
      .findOne({ projectId: projectId });
      
    if (projectSettings) {
      return NextResponse.json(projectSettings.tags || []);
    } else {
      // Return default project tags
      const defaultTags = ['frontend', 'backend', 'bug', 'feature', 'urgent', 'documentation'];
      return NextResponse.json(defaultTags);
    }
  } catch (error) {
    console.error('Error fetching project tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project tags' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }
    
    const db = await getAdminDb();
    
    // Update project settings with new tags
    await db.collection('projectSettings')
      .updateOne(
        { projectId: projectId },
        { $set: { tags } },
        { upsert: true }
      );
    
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error updating project tags:', error);
    return NextResponse.json(
      { error: 'Failed to update project tags' },
      { status: 500 }
    );
  }
}
