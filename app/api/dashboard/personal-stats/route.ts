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

    // Get current week boundaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get today boundaries
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    // Fetch all user tasks from both regular tasks and personal tasks collections
    const [regularTasks, personalTasks] = await Promise.all([
      database.collection("tasks").find({
        $or: [
          { ownerId: userId },
          { assignedTo: userId }
        ]
      }).toArray(),
      database.collection("personalTasks").find({
        userId: userId  // Personal tasks use userId, not ownerId
      }).toArray()
    ]);

    const allTasks = [...regularTasks, ...personalTasks];

    console.log('Found tasks for user:', userId);
    console.log('Regular tasks:', regularTasks.length);
    console.log('Personal tasks:', personalTasks.length);
    console.log('Total tasks:', allTasks.length);
    console.log('Sample task statuses:', allTasks.slice(0, 3).map(t => ({ status: t.status, title: t.title })));

    // Calculate active tasks (not completed)
    const activeTasks = allTasks.filter(task => {
      const isCompleted = task.status === 'done' || task.status === 'completed' || task.columnId === 'done';
      return !isCompleted;
    }).length;

    console.log('Active tasks calculation:', activeTasks);

    // Calculate completed this week
    const completedThisWeek = allTasks.filter(task => {
      const isCompleted = task.status === 'done' || task.status === 'completed' || task.columnId === 'done';
      if (!isCompleted) return false;
      if (!task.completedAt && !task.updatedAt) return false;
      
      const completedDate = new Date(task.completedAt || task.updatedAt);
      return completedDate >= startOfWeek && completedDate < endOfWeek;
    }).length;

    console.log('Completed this week:', completedThisWeek, 'Week range:', startOfWeek, 'to', endOfWeek);

    // Calculate completed today
    const tasksCompletedToday = allTasks.filter(task => {
      const isCompleted = task.status === 'done' || task.status === 'completed' || task.columnId === 'done';
      if (!isCompleted) return false;
      if (!task.completedAt && !task.updatedAt) return false;
      
      const completedDate = new Date(task.completedAt || task.updatedAt);
      return completedDate >= startOfToday && completedDate < endOfToday;
    }).length;

    // Calculate streak days (consecutive days with at least 1 completed task)
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) { // Check up to 30 days back
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const completedThatDay = allTasks.some(task => {
        const isCompleted = task.status === 'done' || task.status === 'completed' || task.columnId === 'done';
        if (!isCompleted) return false;
        if (!task.completedAt && !task.updatedAt) return false;
        
        const completedDate = new Date(task.completedAt || task.updatedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });

      if (completedThatDay) {
        streakDays++;
      } else if (i > 0) { // Don't break on today if no tasks completed yet
        break;
      }
    }

    console.log('Calculated streak:', streakDays, 'days');
    console.log('Tasks completed today:', tasksCompletedToday);

    // Calculate focus time from time tracking data
    let focusTime = 0;
    
    // Get time tracking entries from this week
    const timeEntries = await database.collection("timeTracking").find({
      userId: userId,
      date: {
        $gte: startOfWeek,
        $lt: endOfWeek
      }
    }).toArray();

    focusTime = timeEntries.reduce((total, entry) => {
      return total + (entry.minutes || 0);
    }, 0);

    // If no time tracking data, estimate from task completion times
    if (focusTime === 0) {
      const completedTasksThisWeek = allTasks.filter(task => {
        const isCompleted = task.status === 'done' || task.status === 'completed' || task.columnId === 'done';
        if (!isCompleted) return false;
        if (!task.completedAt && !task.updatedAt) return false;
        
        const completedDate = new Date(task.completedAt || task.updatedAt);
        return completedDate >= startOfWeek && completedDate < endOfWeek;
      });

      // Estimate 30-90 minutes per completed task based on priority
      focusTime = completedTasksThisWeek.reduce((total, task) => {
        let estimatedMinutes = 45; // default
        if (task.priority === 'high') estimatedMinutes = 90;
        else if (task.priority === 'low') estimatedMinutes = 30;
        return total + estimatedMinutes;
      }, 0);
    }

    const stats = {
      activeTasks,
      completedThisWeek,
      totalTasks: allTasks.length,
      focusTime,
      streakDays,
      tasksCompletedToday,
      productivityScore: Math.min(100, (completedThisWeek * 10) + (streakDays * 5)), // Simple calculation
      averageTaskCompletion: 2.5 // Could be calculated from actual data
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching personal dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
