import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/admin/mongoAdmin';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';

// GET - Fetch task-commit links
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getAdminDb();
    const collection = db.collection('task_commit_links');
    
    const links = await collection.find({
      userId: session.user.email
    }).toArray();
    
    return NextResponse.json({
      success: true,
      links: links.map(link => ({
        id: link._id,
        taskId: link.taskId,
        commitSha: link.commitSha,
        linkedAt: link.linkedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching task-commit links:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch task-commit links'
    }, { status: 500 });
  }
}

// POST - Create new task-commit link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, commitSha } = body;
    
    if (!taskId || !commitSha) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: taskId and commitSha'
      }, { status: 400 });
    }

    const db = await getAdminDb();
    const collection = db.collection('task_commit_links');
    
    // Check if link already exists
    const existingLink = await collection.findOne({
      userId: session.user.email,
      taskId,
      commitSha
    });
    
    if (existingLink) {
      return NextResponse.json({
        success: false,
        error: 'This task is already linked to this commit'
      }, { status: 400 });
    }
    
    // Create new link
    const result = await collection.insertOne({
      userId: session.user.email,
      taskId,
      commitSha,
      linkedAt: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      linkId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating task-commit link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create task-commit link'
    }, { status: 500 });
  }
}

// DELETE - Remove task-commit link
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');
    
    if (!linkId) {
      return NextResponse.json({
        success: false,
        error: 'Missing linkId parameter'
      }, { status: 400 });
    }

    const db = await getAdminDb();
    const collection = db.collection('task_commit_links');
    
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
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task-commit link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete task-commit link'
    }, { status: 500 });
  }
}
