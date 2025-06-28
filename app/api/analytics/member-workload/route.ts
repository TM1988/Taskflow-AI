import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/admin/mongoAdmin';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const memberId = searchParams.get('memberId');

    if (!projectId || !memberId) {
      return NextResponse.json(
        { error: 'Project ID and member ID are required' },
        { status: 400 }
      );
    }

    // Get project data to find member's task limit
    const projectRef = doc(firestore, 'projects', projectId);
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

    // Get task limit from member settings or default
    const memberSettings = projectData.memberSettings?.[memberId];
    const taskLimit = memberSettings?.taskLimit || 10; // Default to 10 if not set

    const db = await getAdminDb();
    
    // Get active tasks assigned to this member in this project
    const activeTasks = await db.collection('tasks')
      .find({
        projectId: projectId,
        assigneeId: memberId,
        status: { $ne: 'completed' }
      })
      .toArray();

    // Get completed tasks this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const completedThisWeek = await db.collection('tasks')
      .find({
        projectId: projectId,
        assigneeId: memberId,
        status: 'completed',
        completedAt: { $gte: oneWeekAgo.toISOString() }
      })
      .toArray();

    // Get overdue tasks
    const now = new Date().toISOString();
    const overdueTasks = await db.collection('tasks')
      .find({
        projectId: projectId,
        assigneeId: memberId,
        status: { $ne: 'completed' },
        dueDate: { $lt: now }
      })
      .toArray();

    const assignedTasks = activeTasks.length;
    const workloadPercentage = Math.round((assignedTasks / taskLimit) * 100);

    return NextResponse.json({
      assignedTasks,
      taskLimit,
      workloadPercentage,
      completedThisWeek: completedThisWeek.length,
      overdueTasks: overdueTasks.length,
      tasks: activeTasks.map((task: any) => ({
        id: task._id.toString(),
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
      }))
    });

  } catch (error) {
    console.error('Error fetching member workload:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member workload' },
      { status: 500 }
    );
  }
}
