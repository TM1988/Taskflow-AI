import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;
    const body = await request.json();
    const { assigneeId } = body;

    if (!assigneeId) {
      return NextResponse.json(
        { error: 'Assignee ID is required' },
        { status: 400 }
      );
    }

    const { db: database } = await connectDB();
    
    // Update the task with the new assignee
    const result = await database.collection('tasks').updateOne(
      { _id: new ObjectId(taskId), projectId },
      { 
        $set: { 
          assigneeId,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task assigned successfully'
    });
  } catch (error) {
    console.error('Task assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const { projectId, taskId } = params;

    const { db: database } = await connectDB();
    
    // Remove the assignee from the task
    const result = await database.collection('tasks').updateOne(
      { _id: new ObjectId(taskId), projectId },
      { 
        $unset: { assigneeId: "" },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task unassigned successfully'
    });
  } catch (error) {
    console.error('Task unassignment error:', error);
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    );
  }
}
