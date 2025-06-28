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

    // Get user details for all members
    const users = await database.collection("users").find({
      uid: { $in: memberIds }
    }).toArray();

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

    // Calculate contributions for each member
    const teamMembers = memberIds.map(memberId => {
      const user = users.find((u: any) => u.uid === memberId);
      const memberTasks = tasks.filter((t: any) => t.assignedTo === memberId);
      const completedTasks = memberTasks.filter((t: any) => t.status === 'completed');
      const memberTimeEntries = timeEntries.filter((te: any) => te.userId === memberId);
      
      const hoursWorked = memberTimeEntries.reduce((total: number, entry: any) => {
        return total + (entry.duration || 0);
      }, 0) / 60; // Convert minutes to hours

      const completionRate = memberTasks.length > 0 
        ? (completedTasks.length / memberTasks.length) * 100 
        : 0;

      // Check if member was active this week
      const isActive = memberTimeEntries.length > 0 || 
        completedTasks.some((t: any) => {
          const completedDate = new Date(t.completedAt || t.updatedAt);
          return completedDate >= weekAgo;
        });

      // Determine role
      let role = 'Member';
      if (memberId === project.createdBy) {
        role = 'Project Lead';
      } else {
        const member = project.members?.find((m: any) => m.userId === memberId);
        if (member?.role) {
          role = member.role;
        }
      }

      return {
        id: memberId,
        name: user?.displayName || user?.email || 'Unknown User',
        email: user?.email || '',
        avatar: user?.photoURL,
        role,
        tasksCompleted: completedTasks.length,
        totalTasks: memberTasks.length,
        hoursWorked,
        completionRate,
        isActive
      };
    });

    // Sort by completion rate (descending)
    teamMembers.sort((a, b) => b.completionRate - a.completionRate);

    return NextResponse.json({
      teamMembers,
      summary: {
        totalMembers: teamMembers.length,
        activeMembers: teamMembers.filter(m => m.isActive).length,
        avgCompletionRate: teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length,
        totalHours: teamMembers.reduce((sum, m) => sum + m.hoursWorked, 0)
      }
    });

  } catch (error) {
    console.error("Error fetching team contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch team contributions" },
      { status: 500 }
    );
  }
}
