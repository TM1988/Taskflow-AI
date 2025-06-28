import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  try {
    const { projectId, memberId } = params;
    const body = await request.json();
    const { taskLimit } = body;

    if (!taskLimit || taskLimit < 1 || taskLimit > 100) {
      return NextResponse.json(
        { error: 'Task limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Update the member's task limit in the project
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();
    const members = projectData.members || [];
    
    // Check if member exists in project (members is array of user IDs)
    if (!members.includes(memberId) && projectData.ownerId !== memberId) {
      return NextResponse.json(
        { error: 'Member not found in project' },
        { status: 404 }
      );
    }

    // Store task limit in memberSettings object
    const memberSettings = projectData.memberSettings || {};
    memberSettings[memberId] = {
      ...memberSettings[memberId],
      taskLimit
    };

    // Update the project document
    await updateDoc(projectRef, { 
      memberSettings,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Task limit updated successfully',
      taskLimit
    });
  } catch (error) {
    console.error('Task limit update error:', error);
    return NextResponse.json(
      { error: 'Failed to update task limit' },
      { status: 500 }
    );
  }
}
