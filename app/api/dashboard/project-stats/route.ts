import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }

    let tasks: any[] = [];
    let timeEntries: any[] = [];
    let projectMembers: any[] = [];

    // Check if it's Firestore (has doc() method) or MongoDB
    if (database && typeof (database as any).doc === 'function') {
      // Firestore
      const db = database as any;
      
      try {
        // Get project tasks
        const projectTasksRef = db.collection('tasks');
        const taskSnapshot = await projectTasksRef.where('projectId', '==', projectId).get();
        
        tasks = taskSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
          completedAt: doc.data().completedAt?.toDate?.() || null,
          dueDate: doc.data().dueDate?.toDate?.() || null,
        }));

        // Get project time tracking
        const timeTrackingRef = db.collection('timeTracking');
        const timeSnapshot = await timeTrackingRef.where('projectId', '==', projectId).get();
        
        timeEntries = timeSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        }));

        // Get project info to get members
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();
        if (projectDoc.exists) {
          const projectData = projectDoc.data();
          projectMembers = projectData?.members || [];
        }
      } catch (error) {
        console.error("Firestore query error:", error);
        tasks = [];
        timeEntries = [];
        projectMembers = [];
      }
    } else {
      // MongoDB
      try {
        const tasksCollection = (database as any).collection('tasks');
        tasks = await tasksCollection.find({ projectId }).toArray();

        const timeTrackingCollection = (database as any).collection('timeTracking');
        timeEntries = await timeTrackingCollection.find({ projectId }).toArray();

        const projectsCollection = (database as any).collection('projects');
        const project = await projectsCollection.findOne({ _id: projectId });
        projectMembers = project?.members || [];
      } catch (error) {
        console.error("MongoDB query error:", error);
        tasks = [];
        timeEntries = [];
        projectMembers = [];
      }
    }

    const stats = await calculateProjectStats(tasks, timeEntries, projectMembers);
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching project dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch project dashboard stats" },
      { status: 500 }
    );
  }
}

async function calculateProjectStats(tasks: any[], timeEntries: any[], members: string[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total project tasks
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(task => 
    task.status !== 'completed' && task.status !== 'done' && task.status !== 'archived'
  ).length;
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' || task.status === 'done'
  ).length;

  // Tasks completed this week
  const completedThisWeek = tasks.filter(task => {
    if (task.status !== 'completed' && task.status !== 'done') return false;
    const completedAt = task.completedAt ? new Date(task.completedAt) : null;
    return completedAt && completedAt >= weekStart;
  }).length;

  // Tasks completed today
  const tasksCompletedToday = tasks.filter(task => {
    if (task.status !== 'completed' && task.status !== 'done') return false;
    const completedAt = task.completedAt ? new Date(task.completedAt) : null;
    return completedAt && completedAt >= todayStart;
  }).length;

  // Focus time this week (total team time)
  const weeklyTimeEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date || entry.createdAt);
    return entryDate >= weekStart;
  });
  const focusTime = weeklyTimeEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0);

  // Team productivity metrics
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const productivityScore = Math.min(100, Math.round(
    (completionRate * 0.4) + 
    (completedThisWeek * 10) + 
    (Math.min(focusTime / 60, 40)) // Cap at 40 hours per week
  ));

  // Average task completion time
  const completedTasksWithDates = tasks.filter(task => 
    (task.status === 'completed' || task.status === 'done') && 
    task.completedAt && 
    task.createdAt
  );
  
  const avgTaskCompletion = completedTasksWithDates.length > 0
    ? completedTasksWithDates.reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        const diffDays = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / completedTasksWithDates.length
    : 0;

  // Team streak (consecutive days with activity)
  let streakDays = 0;
  let currentDate = new Date(todayStart);
  
  while (streakDays < 30) { // Check up to 30 days back
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    
    const hasActivity = tasks.some(task => {
      const updatedAt = new Date(task.updatedAt || task.createdAt);
      return updatedAt >= dayStart && updatedAt < dayEnd;
    }) || timeEntries.some(entry => {
      const entryDate = new Date(entry.date || entry.createdAt);
      return entryDate >= dayStart && entryDate < dayEnd;
    });
    
    if (hasActivity) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    activeTasks,
    completedThisWeek,
    totalTasks,
    focusTime, // in minutes
    streakDays,
    productivityScore,
    tasksCompletedToday,
    averageTaskCompletion: Math.round(avgTaskCompletion * 10) / 10,
    teamSize: members.length,
    completionRate: Math.round(completionRate * 10) / 10
  };
}
