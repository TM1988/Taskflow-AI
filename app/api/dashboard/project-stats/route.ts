import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/config/firebase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Helper function to determine which database to use for a project
async function getDatabaseForProject(
  projectId: string, 
  userId?: string, 
  directOrganizationId?: string
) {
  try {
    console.log(
      `[PROJECT STATS getDatabaseForProject] Project: ${projectId}, UserID: ${userId}, DirectOrgID: ${directOrganizationId}`,
    );

    if (directOrganizationId) {
      console.log(
        `[PROJECT STATS getDatabaseForProject] Using directOrganizationId: ${directOrganizationId} for project ${projectId}.`,
      );
      return await getOrganizationDatabaseConnection(directOrganizationId);
    }

    console.log(
      `[PROJECT STATS getDatabaseForProject] No directOrganizationId. Fetching project ${projectId} from Firestore to find its organization.`,
    );

    const firestore = getFirestore(app);
    const projectDocRef = doc(firestore, "projects", projectId);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      const project = projectDoc.data();
      console.log(
        `[PROJECT STATS getDatabaseForProject] Project ${projectId} found in Firestore. Data:`,
        project,
      );

      if (project.organizationId) {
        console.log(
          `[PROJECT STATS getDatabaseForProject] Project ${projectId} has organizationId: ${project.organizationId} from Firestore. Using organization database.`,
        );
        return await getOrganizationDatabaseConnection(project.organizationId);
      } else {
        console.log(
          `[PROJECT STATS getDatabaseForProject] Project ${projectId} found in Firestore but has no organizationId.`,
        );
      }
    } else {
      console.log(
        `[PROJECT STATS getDatabaseForProject] Project ${projectId} not found in Firestore.`,
      );
    }

    if (userId) {
      console.log(
        `[PROJECT STATS getDatabaseForProject] Falling back to user database for userId: ${userId} (project ${projectId}).`,
      );
      return await getUserDatabaseConnection(userId);
    } else {
      console.log(
        `[PROJECT STATS getDatabaseForProject] No userId provided for fallback, and project ${projectId} could not be associated with an organization. Falling back to admin database.`,
      );
      return await getAdminDb();
    }
  } catch (error) {
    console.error(
      `[PROJECT STATS getDatabaseForProject] Error determining database for project ${projectId}:`,
      error,
    );
    console.log(
      `[PROJECT STATS getDatabaseForProject] Falling back to admin database due to an error for project ${projectId}.`,
    );
    return await getAdminDb();
  }
}

// Helper function to get MongoDB project ID if Firebase ID is provided - COPIED FROM MEMBER WORKLOAD API
async function getMongoProjectId(projectId: string): Promise<string> {
  try {
    // Check if this is a Firebase ID that has a corresponding MongoDB ID
    if (projectId.length < 25) {
      // Firebase IDs are shorter than MongoDB ObjectIds
      console.log("[PROJECT STATS getMongoProjectId] Project ID", projectId, "looks like Firebase ID, checking for MongoDB mapping...");
      
      const firestore = getFirestore(app);
      const projectDocRef = doc(firestore, "projects", projectId);
      const projectDoc = await getDoc(projectDocRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        if (projectData.customDbProjectId) {
          console.log("[PROJECT STATS getMongoProjectId] Found MongoDB project ID:", projectData.customDbProjectId, "for Firebase ID:", projectId);
          return projectData.customDbProjectId;
        }
      }
    }

    // If no mapping found, return the original ID
    console.log("[PROJECT STATS getMongoProjectId] Using original project ID:", projectId);
    return projectId;
  } catch (error) {
    console.error("[PROJECT STATS getMongoProjectId] Error checking Firebase mapping:", error);
    return projectId;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");
    const organizationId = searchParams.get("organizationId");

    console.log("[PROJECT STATS] Request params:", {
      userId,
      projectId,
      organizationId
    });

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

    // Use the same database logic as member-workload API - ALWAYS use getDatabaseForProject
    const database = await getDatabaseForProject(projectId, userId, organizationId || undefined);
      
    if (!database) {
      throw new Error("Database connection failed");
    }

    let tasks: any[] = [];
    let timeEntries: any[] = [];
    let projectMembers: any[] = [];
    let completedTasksFromBoard: any[] = [];

    // ALSO get task data from Board API to check column positions
    try {
      console.log("[PROJECT STATS] Fetching board data to check task columns...");
      const boardApiUrl = `/api/board/${projectId}?organizationId=${organizationId}`;
      const boardResponse = await fetch(`http://localhost:3000${boardApiUrl}`);
      
      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        console.log("[PROJECT STATS] Board API success. Structure:", {
          hasBoard: !!boardData.board,
          hasColumns: !!boardData.columns,
          columnCount: boardData.columns?.length || 0
        });
        
        // Find tasks in completion columns (Done, Completed, Finished, etc.)
        const completionColumnNames = ['done', 'completed', 'finished', 'complete', 'closed'];
        
        if (boardData.board && boardData.columns) {
          // Board API returns: { board: { "columnId": { tasks: [...] } }, columns: [...] }
          Object.entries(boardData.board).forEach(([columnId, columnData]: [string, any]) => {
            // Find the column name by matching columnId with columns array
            const column = boardData.columns.find((col: any) => col.id === columnId || col._id === columnId);
            const columnName = column?.name?.toLowerCase() || columnId.toLowerCase();
            const isCompletionColumn = completionColumnNames.some(name => columnName.includes(name));
            
            if (isCompletionColumn && columnData.tasks) {
              console.log(`[PROJECT STATS] Found ${columnData.tasks.length} tasks in completion column: "${column?.name || columnId}"`);
              completedTasksFromBoard.push(...columnData.tasks.map((task: any) => ({
                ...task,
                columnName: column?.name || columnId,
                isCompleted: true
              })));
            }
          });
        }
        
        console.log("[PROJECT STATS] Total completed tasks from board:", completedTasksFromBoard.length);
      } else {
        console.log("[PROJECT STATS] Board API failed, will use status-based detection only");
      }
    } catch (error) {
      console.error("[PROJECT STATS] Error fetching board data:", error);
    }

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
        console.error("[PROJECT STATS] Firestore query error:", error);
        tasks = [];
        timeEntries = [];
        projectMembers = [];
      }
    } else {
      // MongoDB - need to handle project ID mapping
      try {
        console.log("[PROJECT STATS] Using MongoDB database");
        
        // Get the correct MongoDB project ID
        const mongoProjectId = await getMongoProjectId(projectId);
        console.log("[PROJECT STATS] Using mongoProjectId:", mongoProjectId, "for database operations");

        const tasksCollection = (database as any).collection('tasks');
        
        // Try with MongoDB project ID first
        console.log("[PROJECT STATS] Querying tasks for project:", mongoProjectId);
        tasks = await tasksCollection.find({ projectId: mongoProjectId }).toArray();
        console.log("[PROJECT STATS] Found", tasks.length, "tasks with mongoProjectId");
        
        // If no tasks found with mapped ID, try with original Firebase ID
        if (tasks.length === 0 && mongoProjectId !== projectId) {
          console.log("[PROJECT STATS] No tasks found with mongoProjectId, trying original projectId...");
          tasks = await tasksCollection.find({ projectId: projectId }).toArray();
          console.log("[PROJECT STATS] Found", tasks.length, "tasks with original projectId");
        }

        console.log("[PROJECT STATS] Active tasks found:", tasks.map(t => ({
          id: t.id || t._id,
          title: t.title,
          status: t.status,
          assigneeId: t.assigneeId,
          projectId: t.projectId
        })));

        const timeTrackingCollection = (database as any).collection('timeTracking');
        timeEntries = await timeTrackingCollection.find({ 
          $or: [
            { projectId: mongoProjectId },
            { projectId: projectId }
          ]
        }).toArray();

        // For members, try to get from Firebase project first
        const firestore = getFirestore(app);
        const projectDocRef = doc(firestore, "projects", projectId);
        const projectDoc = await getDoc(projectDocRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          projectMembers = projectData?.members || [];
          console.log("[PROJECT STATS] Got project members from Firebase:", projectMembers.length);
        } else {
          // Fallback to MongoDB if available
          const projectsCollection = (database as any).collection('projects');
          const project = await projectsCollection.findOne({ 
            $or: [
              { _id: mongoProjectId },
              { _id: projectId }
            ]
          });
          projectMembers = project?.members || [];
          console.log("[PROJECT STATS] Got project members from MongoDB:", projectMembers.length);
        }
      } catch (error) {
        console.error("[PROJECT STATS] MongoDB query error:", error);
        tasks = [];
        timeEntries = [];
        projectMembers = [];
      }
    }

    // Convert completed tasks from board to array of IDs
    const completedTaskIds = completedTasksFromBoard.map((task: any) => 
      task._id?.toString() || task.id?.toString()
    ).filter(Boolean);
    
    console.log("[PROJECT STATS] Completed task IDs from board:", completedTaskIds);

    const stats = await calculateProjectStats(tasks, timeEntries, projectMembers, completedTaskIds);
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching project dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch project dashboard stats" },
      { status: 500 }
    );
  }
}

async function calculateProjectStats(tasks: any[], timeEntries: any[], members: string[], completedTasksFromBoard: string[] = []) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total project tasks
  const totalTasks = tasks.length;
  
  // Function to check if task is completed (by board position or status)
  const isTaskCompleted = (task: any) => {
    const taskId = task._id?.toString() || task.id?.toString();
    const isCompleteByBoard = completedTasksFromBoard.includes(taskId);
    const isCompleteByStatus = task.status === 'completed' || task.status === 'done';
    return isCompleteByBoard || isCompleteByStatus;
  };
  
  const activeTasks = tasks.filter(task => 
    !isTaskCompleted(task) && task.status !== 'archived'
  ).length;
  const completedTasks = tasks.filter(isTaskCompleted).length;

  // Tasks completed this week
  const completedThisWeek = tasks.filter(task => {
    if (!isTaskCompleted(task)) return false;
    
    const taskId = task._id?.toString() || task.id?.toString();
    const isCompleteByBoard = completedTasksFromBoard.includes(taskId);
    
    // For board-detected completed tasks, use updatedAt as completion time
    // For status-based completed tasks, use completedAt
    const completionDate = isCompleteByBoard 
      ? (task.updatedAt ? new Date(task.updatedAt) : null)
      : (task.completedAt ? new Date(task.completedAt) : null);
      
    return completionDate && completionDate >= weekStart;
  }).length;

  // Tasks completed today
  const tasksCompletedToday = tasks.filter(task => {
    if (!isTaskCompleted(task)) return false;
    
    const taskId = task._id?.toString() || task.id?.toString();
    const isCompleteByBoard = completedTasksFromBoard.includes(taskId);
    
    // For board-detected completed tasks, use updatedAt as completion time
    // For status-based completed tasks, use completedAt
    const completionDate = isCompleteByBoard 
      ? (task.updatedAt ? new Date(task.updatedAt) : null)
      : (task.completedAt ? new Date(task.completedAt) : null);
      
    return completionDate && completionDate >= todayStart;
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
