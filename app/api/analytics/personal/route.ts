import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }

    let tasks: any[] = [];

    // Check if it's Firestore (has doc() method) or MongoDB
    if (database && typeof (database as any).doc === 'function') {
      // Firestore
      const db = database as any;
      
      try {
        const personalTasksRef = db.collection('personalTasks');
        const snapshot = await personalTasksRef.where('userId', '==', userId).get();
        
        tasks = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
          completedAt: doc.data().completedAt?.toDate?.() || null,
          dueDate: doc.data().dueDate?.toDate?.() || null,
        }));
      } catch (error) {
        console.error("Firestore query error:", error);
        // If collection doesn't exist or error, return empty tasks
        tasks = [];
      }
    } else {
      // MongoDB
      try {
        const collection = (database as any).collection('personalTasks');
        tasks = await collection.find({ userId }).toArray();
      } catch (error) {
        console.error("MongoDB query error:", error);
        // If collection doesn't exist or error, return empty tasks
        tasks = [];
      }
    }

    return NextResponse.json(await calculateAnalytics(tasks));

  } catch (error) {
    console.error("Error fetching personal analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal analytics" },
      { status: 500 }
    );
  }
}

async function calculateAnalytics(tasks: any[]) {
  // Calculate analytics data
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'done').length;
  const pendingTasks = totalTasks - completedTasks;

  // Recent tasks (last 30 days)
  const recentTasks = tasks.filter(task => 
    new Date(task.createdAt) >= thirtyDaysAgo
  );

  // Weekly completion data for burndown chart
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const tasksCompletedByDay = tasks.filter(task => {
      const completedAt = task.completedAt ? new Date(task.completedAt) : null;
      return completedAt && completedAt >= dayStart && completedAt < dayEnd;
    }).length;

    const remainingTasks = pendingTasks - tasksCompletedByDay;
    
    weeklyData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toISOString().split('T')[0],
      remaining: Math.max(0, remainingTasks),
      completed: tasksCompletedByDay,
      ideal: Math.max(0, pendingTasks - (6 - i) * (pendingTasks / 7))
    });
  }

  // Velocity data (tasks completed per week over last 4 weeks)
  const velocityData = [];
  for (let week = 3; week >= 0; week--) {
    const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);
    
    const weeklyCompleted = tasks.filter(task => {
      const completedAt = task.completedAt ? new Date(task.completedAt) : null;
      return completedAt && completedAt >= weekStart && completedAt < weekEnd;
    }).length;

    velocityData.push({
      week: `Week ${4 - week}`,
      completed: weeklyCompleted,
      created: tasks.filter(task => {
        const createdAt = new Date(task.createdAt);
        return createdAt >= weekStart && createdAt < weekEnd;
      }).length
    });
  }

  // Task status distribution
  const statusDistribution = tasks.reduce((acc: any, task) => {
    const status = task.status || 'todo';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Task priority distribution (including ALL tasks, not just active ones)
  const priorityDistribution = tasks.reduce((acc: any, task) => {
    const priority = task.priority?.toLowerCase() || 'medium'; // Default to medium if no priority
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  // Overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'done') return false;
    return new Date(task.dueDate) < now;
  }).length;

  // Average completion time (for completed tasks with due dates)
  const completedWithDueDates = tasks.filter(task => 
    (task.status === 'completed' || task.status === 'done') && 
    task.completedAt && 
    task.dueDate
  );

  const avgCompletionTime = completedWithDueDates.length > 0 
    ? completedWithDueDates.reduce((sum, task) => {
        const dueDate = new Date(task.dueDate);
        const completedAt = new Date(task.completedAt);
        const diffDays = Math.ceil((completedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / completedWithDueDates.length
    : 0;

  return {
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
      avgCompletionTime: avgCompletionTime.toFixed(1)
    },
    burndown: weeklyData,
    velocity: velocityData,
    statusDistribution,
    priorityDistribution,
    recentTasks: recentTasks.slice(0, 10) // Latest 10 tasks
  };
}
