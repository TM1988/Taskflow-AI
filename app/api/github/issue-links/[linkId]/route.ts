import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/admin/mongoAdmin';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';

// DELETE - Remove specific task-issue link by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId } = params;
    
    if (!linkId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: linkId'
      }, { status: 400 });
    }

    const db = await getAdminDb();
    const collection = db.collection('task_issue_links');
    
    // Delete the link (ensure it belongs to the current user)
    const result = await collection.deleteOne({
      _id: new ObjectId(linkId),
      userId: session.user.email
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Link not found or unauthorized'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Task-issue link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task-issue link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete task-issue link'
    }, { status: 500 });
  }
}
