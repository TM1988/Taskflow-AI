import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Project ID and User ID are required" },
        { status: 400 }
      );
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }
    
    // Verify user has access to this project
    const project = await database.collection("projects").findOne({
      _id: new ObjectId(projectId),
      $or: [
        { createdBy: userId },
        { "members.userId": userId }
      ]
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get all project members
    const memberIds = [
      project.createdBy,
      ...(project.members || []).map((m: any) => m.userId)
    ];

    // Get tasks for this project
    const tasks = await database.collection("tasks").find({
      projectId: new ObjectId(projectId)
    }).toArray();

    // Get time entries for this project (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const timeEntries = await database.collection("timeEntries").find({
      projectId: new ObjectId(projectId),
      date: { $gte: weekAgo }
    }).toArray();

    // Calculate analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress').length;
    const todoTasks = tasks.filter((t: any) => t.status === 'todo').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate this week's completions
    const thisWeekCompleted = tasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= weekAgo;
    }).length;

    // Calculate previous week's completions
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const previousWeekCompleted = tasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= twoWeeksAgo && completedDate < weekAgo;
    }).length;

    // Calculate total time worked
    const totalMinutes = timeEntries.reduce((total: number, entry: any) => {
      return total + (entry.duration || 0);
    }, 0);
    const totalHours = totalMinutes / 60;

    // Calculate active members this week
    const activeMemberIds = new Set([
      ...timeEntries.map((te: any) => te.userId),
      ...tasks.filter((t: any) => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= weekAgo;
      }).map((t: any) => t.assignedTo)
    ]);

    const activeMembers = activeMemberIds.size;

    // Calculate average tasks per member
    const avgTasksPerMember = memberIds.length > 0 ? totalTasks / memberIds.length : 0;

    // Calculate average hours per member
    const avgHoursPerMember = memberIds.length > 0 ? totalHours / memberIds.length : 0;

    // Find most active day
    const dayActivity = timeEntries.reduce((acc: any, entry: any) => {
      const day = entry.date.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + (entry.duration || 0);
      return acc;
    }, {});

    const mostActiveDay = Object.keys(dayActivity).reduce((a, b) => 
      dayActivity[a] > dayActivity[b] ? a : b, 
      Object.keys(dayActivity)[0] || 'No data'
    );

    // Determine velocity trend
    let weeklyTrend: 'up' | 'down' | 'neutral' = 'neutral';
    if (thisWeekCompleted > previousWeekCompleted) {
      weeklyTrend = 'up';
    } else if (thisWeekCompleted < previousWeekCompleted) {
      weeklyTrend = 'down';
    }

    // Find top contributor (most tasks completed this week)
    const memberContributions = memberIds.map(memberId => ({
      id: memberId,
      tasksCompleted: tasks.filter((t: any) => 
        t.assignedTo === memberId && 
        t.status === 'completed' && 
        t.completedAt && 
        new Date(t.completedAt) >= weekAgo
      ).length
    }));

    const topContributor = memberContributions.reduce((top, current) => 
      current.tasksCompleted > top.tasksCompleted ? current : top,
      { id: '', tasksCompleted: 0 }
    );

    const analyticsData = {
      teamMetrics: {
        totalMembers: memberIds.length,
        activeMembers,
        avgTasksPerMember: Math.round(avgTasksPerMember * 10) / 10,
        topContributor: topContributor.id || 'No data'
      },
      projectProgress: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate: Math.round(completionRate * 10) / 10
      },
      timeTracking: {
        totalHours: Math.round(totalHours * 10) / 10,
        avgHoursPerMember: Math.round(avgHoursPerMember * 10) / 10,
        mostActiveDay
      },
      velocity: {
        currentWeekCompleted: thisWeekCompleted,
        previousWeekCompleted,
        weeklyTrend
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Error fetching project analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch project analytics" },
      { status: 500 }
    );
  }
}
