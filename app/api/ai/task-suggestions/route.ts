// app/api/ai/task-suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  userId: string;
  projectId?: string;
  tags?: string[];
  assigneeId?: string;
}

interface AISuggestion {
  id: string;
  type: 'optimization' | 'risk' | 'priority';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'deadlines' | 'workload' | 'collaboration';
}

// Get Google AI API key from user's settings or project settings
async function getGoogleAIKey(userId: string, projectId?: string) {
  try {
    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    // If we have a project ID and it's not personal, check project AI config first
    if (projectId && projectId !== "personal") {
      try {
        const db = await import('@/lib/firebase').then(m => m.db);
        const { doc, getDoc } = await import('firebase/firestore');
        
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          
          // Check if project has AI enabled and has an API key
          if (projectData.aiConfig?.isEnabled && projectData.aiConfig?.apiKey) {
            console.log('Using project AI configuration');
            return projectData.aiConfig.apiKey;
          }
        }
      } catch (error) {
        console.error('Error fetching project AI config:', error);
      }
    }
    
    // Fallback to user's personal AI settings
    const userSettings = await mongoDb.collection('userAiConfigs').findOne({ userId });
    console.log('Found user AI config:', userSettings ? 'Yes' : 'No', userSettings?.isEnabled ? '(enabled)' : '(disabled)');
    
    // Return the API key only if user has enabled AI and has a key
    if (userSettings?.isEnabled && userSettings?.apiKey) {
      console.log('Using personal AI configuration');
      return userSettings.apiKey;
    }
    
    console.log('No AI configuration found');
    return null;
  } catch (error) {
    console.error('Error fetching Google AI key:', error);
    return null;
  }
}

// Real AI-powered analysis function using Google AI
async function generateAISuggestions(
  tasks: Task[], 
  apiKey: string, 
  projectId?: string, 
  teamMembers?: any[], 
  teamWorkloadData?: any
): Promise<AISuggestion[]> {
  try {
    // Prepare comprehensive task data for AI analysis
    const taskAnalysis = {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status !== 'completed').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
      highPriorityTasks: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      tasksByStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tasksByPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      upcomingDeadlines: tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        const dueDate = new Date(t.dueDate);
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        return dueDate >= new Date() && dueDate <= threeDaysFromNow;
      }).length,
      recentlyCreated: tasks.filter(t => {
        const createdDate = new Date(t.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdDate >= weekAgo;
      }).length,
      taskDetails: tasks.map(task => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        description: task.description ? task.description.substring(0, 100) : null,
        tags: task.tags,
        hasProject: !!task.projectId,
        assigneeId: task.assigneeId
      })),
      // Include team workload data if available (project context)
      ...(teamMembers && teamMembers.length > 0 && {
        teamWorkload: {
          totalMembers: teamWorkloadData?.totalMembers || teamMembers.length,
          averageWorkload: teamWorkloadData?.averageWorkload || 0,
          teamMembers: teamMembers.map(member => ({
            id: member.id,
            name: member.name,
            role: member.role,
            taskLimit: member.taskLimit,
            assignedTasks: member.assignedTasks,
            workloadPercentage: Math.round((member.assignedTasks / member.taskLimit) * 100),
            completedThisWeek: member.completedThisWeek,
            overdueTasks: member.overdueTasks,
            isOverloaded: member.assignedTasks >= member.taskLimit * 0.9,
            isUnderutilized: member.assignedTasks < member.taskLimit * 0.3
          })),
          workloadInsights: {
            overloadedMembers: teamWorkloadData?.overloadedMembers?.length || 0,
            underutilizedMembers: teamWorkloadData?.underutilizedMembers?.length || 0,
            membersWithOverdueTasks: teamWorkloadData?.membersWithOverdueTasks?.length || 0
          }
        }
      })
    };

    const isTeamContext = teamMembers && teamMembers.length > 0;
    
    const prompt = `You are a productivity AI assistant for Taskflow AI, a comprehensive task management platform. Based on the user's actual task data${isTeamContext ? ' and team workload information' : ''}, generate 3-5 specific, actionable productivity suggestions.

${projectId ? `PROJECT CONTEXT: You are analyzing tasks for a specific project${isTeamContext ? ' with a team of ' + teamMembers.length + ' members' : ''}. Focus on ${isTeamContext ? 'team collaboration, workload distribution, task assignment, and project completion progress' : 'project-specific insights like task organization, project deadlines, and project completion progress'}.` : 'PERSONAL CONTEXT: You are analyzing personal tasks across all projects and standalone tasks. Focus on individual productivity, personal workflow optimization, and overall task management.'}

TASKFLOW AI PROJECT OVERVIEW:
Taskflow AI is a ${projectId ? 'collaborative project' : 'personal productivity'} platform with the following IMPLEMENTED features:

CORE TASK MANAGEMENT:
- Create, edit, delete tasks with titles, descriptions, priorities (high/medium/low)
- Task statuses: todo, in-progress, completed, on-hold
- Due dates and deadline tracking
- Task tags for organization
${projectId ? '- Project-based task organization and team collaboration' : '- Personal tasks (not tied to projects)'}
- Task completion tracking and statistics
${isTeamContext ? '- Task assignment to team members' : ''}

PROJECT MANAGEMENT:
- Create projects to organize tasks
${projectId ? '- Team workload distribution and collaboration' : '- Personal board for individual tasks'}
- Task assignment to projects
${projectId ? '- Project milestone tracking' : ''}
${isTeamContext ? '- Team member task limits and workload management' : ''}

DASHBOARD & ANALYTICS:
${projectId ? '- Project dashboard with team metrics' : '- Personal dashboard with metrics'}
- Task completion statistics
- Active task counts
- Weekly completion tracking
- Productivity metrics and trends
- Task status breakdowns
${isTeamContext ? '- Team workload analysis and member performance tracking' : ''}

ORGANIZATION FEATURES:
- Task priority management
- Due date management and deadline alerts
- Task categorization with tags
${projectId ? '- Team collaboration and task assignment' : '- Personal productivity tracking'}
${isTeamContext ? '- Team member workload balancing and task redistribution' : ''}

AI FEATURES:
- AI-powered task suggestions (this feature)
- Intelligent insights based on actual task data
- Productivity pattern analysis
${isTeamContext ? '- Team workload optimization suggestions' : ''}

${isTeamContext ? `TEAM WORKLOAD FEATURES:
- Each team member has task limits to prevent overload
- Track member workload percentage (assigned tasks / task limit)
- Identify overloaded members (>90% of task limit)
- Identify underutilized members (<30% of task limit)
- Monitor member completion rates and overdue tasks
- Suggest task redistribution for better team balance` : ''}

IMPORTANT: Only suggest features that exist in Taskflow AI. Do NOT suggest:
- Time blocking (not implemented)
- Calendar integration (not implemented)
${projectId ? '' : '- Team collaboration features when in personal mode'}
- External integrations beyond GitHub
- Features not listed above

USER'S CURRENT ${isTeamContext ? 'TASK & TEAM' : 'TASK'} DATA:
${JSON.stringify(taskAnalysis, null, 2)}

INSTRUCTIONS:
- Analyze the user's actual task patterns, priorities, deadlines, and completion rates
${isTeamContext ? '- Analyze team workload distribution, member performance, and collaboration patterns' : ''}
- Identify productivity bottlenecks, missed deadlines, or workload issues
${isTeamContext ? '- Identify overloaded team members (>90% task limit) and suggest task redistribution' : ''}
${isTeamContext ? '- Identify underutilized team members (<30% task limit) and suggest assigning more tasks' : ''}
${isTeamContext ? '- Address team members with overdue tasks or upcoming deadlines' : ''}
- Provide specific suggestions based on their real data and existing Taskflow features
- Focus on task organization, priority optimization, deadline management, and productivity patterns
${isTeamContext ? '- Include team collaboration optimization and workload balancing suggestions' : ''}
- Reference actual Taskflow features like: task priorities, due dates, project organization, task tags, status management${isTeamContext ? ', team workload management, task assignment' : ''}
- Suggest actionable steps they can take within the existing Taskflow platform
- Respond ONLY with a JSON array, no extra text or explanations

REQUIRED JSON FORMAT:
[
  {
    "id": "unique-id-1",
    "type": "optimization|risk|priority${isTeamContext ? '|workload|collaboration' : ''}",
    "title": "Specific Title Based On Their Data",
    "description": "Detailed description addressing their actual task situation using Taskflow features${isTeamContext ? ' and team workload data' : ''}",
    "priority": "high|medium|low",
    "category": "productivity|deadlines|workload|collaboration"${isTeamContext ? ',\n    "targetMembers": ["member-id-1", "member-id-2"]' : ''}
  }
]

${isTeamContext ? `TEAM WORKLOAD PRIORITIES:
- If any members are overloaded (>90% of task limit), prioritize redistributing tasks
- If members are underutilized (<30% of task limit), suggest assigning more tasks
- Address team members with overdue tasks immediately
- Balance workload across team for optimal productivity
- Consider member roles and capabilities in suggestions

` : ''}Generate suggestions that directly address their ${isTeamContext ? 'task and team workload' : 'task'} patterns and leverage Taskflow's existing capabilities.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        }
      }),
    });

    if (!response.ok) {
      console.error('Google AI API error:', response.status, response.statusText);
      return generateSmartAnalysis(tasks);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('No AI response received');
      return generateSmartAnalysis(tasks);
    }

    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const suggestions = JSON.parse(jsonString);
      
      // Validate and format the response
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions.map((suggestion, index) => ({
          id: suggestion.id || `ai-suggestion-${index}`,
          type: suggestion.type || 'optimization',
          title: suggestion.title || 'AI Suggestion',
          description: suggestion.description || 'AI-generated insight',
          action: '', // Remove action field since we're removing buttons
          priority: suggestion.priority || 'medium',
          category: suggestion.category || 'productivity'
        }));
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Fallback to smart analysis if AI parsing fails
    return generateSmartAnalysis(tasks);

  } catch (error) {
    console.error('Error calling AI service:', error);
    return generateSmartAnalysis(tasks);
  }
}

// Smart analysis fallback when AI is not available
function generateSmartAnalysis(
  tasks: Task[], 
  projectId?: string, 
  teamMembers?: any[], 
  teamWorkloadData?: any
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const now = new Date();

  // 1. Overdue Tasks Analysis
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < now;
  });

  if (overdueTasks.length > 0) {
    suggestions.push({
      id: 'overdue-tasks',
      type: 'risk',
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      description: `You have ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} past their deadline. Review and reschedule these tasks to get back on track.`,
      action: '',
      priority: 'high',
      category: 'deadlines'
    });
  }

  // 2. High Priority Tasks
  const highPriorityTasks = tasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  );

  if (highPriorityTasks.length > 0) {
    suggestions.push({
      id: 'high-priority-focus',
      type: 'priority',
      title: `${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''} pending`,
      description: `Focus on completing your ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''} to maintain productivity momentum.`,
      action: '',
      priority: 'high',
      category: 'productivity'
    });
  }

  // 3. Upcoming Deadlines
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const upcomingTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= now && dueDate <= threeDaysFromNow;
  });

  if (upcomingTasks.length > 0) {
    suggestions.push({
      id: 'upcoming-deadlines',
      type: 'priority',
      title: `${upcomingTasks.length} deadline${upcomingTasks.length > 1 ? 's' : ''} this week`,
      description: `Plan ahead - you have ${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's' : ''} due within the next 3 days.`,
      action: '',
      priority: 'medium',
      category: 'deadlines'
    });
  }

  // 4. Workload Analysis
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  if (activeTasks.length > 15) {
    suggestions.push({
      id: 'high-workload',
      type: 'risk',
      title: 'Heavy workload detected',
      description: `With ${activeTasks.length} active tasks, consider prioritizing the most important ones and deferring less critical work.`,
      action: '',
      priority: 'medium',
      category: 'workload'
    });
  } else if (activeTasks.length > 8) {
    suggestions.push({
      id: 'moderate-workload',
      type: 'optimization',
      title: 'Balanced workload',
      description: `You have ${activeTasks.length} active tasks. Consider grouping similar tasks together for better efficiency.`,
      action: '',
      priority: 'low',
      category: 'productivity'
    });
  }

  // 5. Completion Progress
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  
  if (completionRate > 80) {
    suggestions.push({
      id: 'high-completion',
      type: 'optimization',
      title: 'Excellent progress!',
      description: `You've completed ${Math.round(completionRate)}% of your tasks. Your productivity system is working well.`,
      action: '',
      priority: 'low',
      category: 'productivity'
    });
  } else if (completionRate < 30 && tasks.length > 5) {
    suggestions.push({
      id: 'low-completion',
      type: 'optimization',
      title: 'Focus on task completion',
      description: `Your completion rate is ${Math.round(completionRate)}%. Break large tasks into smaller, manageable pieces.`,
      action: '',
      priority: 'medium',
      category: 'productivity'
    });
  }

  // 6. Task organization suggestions
  const tasksWithoutPriority = tasks.filter(task => !task.priority || task.priority === 'none');
  if (tasksWithoutPriority.length > 0) {
    suggestions.push({
      id: 'set-priorities',
      type: 'optimization',
      title: 'Set task priorities in Taskflow',
      description: `${tasksWithoutPriority.length} task${tasksWithoutPriority.length > 1 ? 's don\'t' : ' doesn\'t'} have priorities set. Use Taskflow's priority system (high/medium/low) to focus on what matters most.`,
      action: '',
      priority: 'low',
      category: 'productivity'
    });
  }

  const tasksWithoutDueDates = tasks.filter(task => !task.dueDate);
  if (tasksWithoutDueDates.length > 2) {
    suggestions.push({
      id: 'add-due-dates',
      type: 'optimization',
      title: 'Add due dates to your tasks',
      description: `${tasksWithoutDueDates.length} tasks don't have due dates. Use Taskflow's deadline tracking to better manage your workload.`,
      action: '',
      priority: 'low',
      category: 'productivity'
    });
  }

  const projectlessPersonalTasks = tasks.filter(task => !task.projectId);
  if (!projectId && projectlessPersonalTasks.length > 5) {
    suggestions.push({
      id: 'organize-into-projects',
      type: 'optimization',
      title: 'Organize tasks into projects',
      description: `Consider creating projects in Taskflow to better organize your ${projectlessPersonalTasks.length} standalone tasks.`,
      action: '',
      priority: 'low',
      category: 'productivity'
    });
  }

  // Project-specific suggestions
  if (projectId) {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const projectActiveTasks = projectTasks.filter(task => task.status !== 'completed');
    const projectCompletedTasks = projectTasks.filter(task => task.status === 'completed');

    if (projectTasks.length > 0) {
      const projectCompletionRate = (projectCompletedTasks.length / projectTasks.length) * 100;
      
      if (projectCompletionRate > 70) {
        suggestions.push({
          id: 'project-near-completion',
          type: 'optimization',
          title: 'Project nearing completion',
          description: `This project is ${Math.round(projectCompletionRate)}% complete. Focus on finishing the remaining ${projectActiveTasks.length} task${projectActiveTasks.length > 1 ? 's' : ''} to wrap up successfully.`,
          action: '',
          priority: 'medium',
          category: 'collaboration'
        });
      }

      if (projectActiveTasks.length > 10) {
        suggestions.push({
          id: 'project-task-distribution',
          type: 'optimization',
          title: 'High project task volume',
          description: `This project has ${projectActiveTasks.length} active tasks. Consider breaking down large tasks and distributing workload effectively.`,
          action: '',
          priority: 'medium',
          category: 'workload'
        });
      }

      const projectOverdueTasks = projectTasks.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < now;
      });

      if (projectOverdueTasks.length > 0) {
        suggestions.push({
          id: 'project-overdue-risk',
          type: 'risk',
          title: 'Project deadlines at risk',
          description: `${projectOverdueTasks.length} project task${projectOverdueTasks.length > 1 ? 's are' : ' is'} overdue. Address these immediately to keep the project on track.`,
          action: '',
          priority: 'high',
          category: 'deadlines'
        });
      }
    }
  }

  // 7. Default encouragement if no specific issues
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'all-good',
      type: 'optimization',
      title: 'Your tasks are well organized',
      description: 'Great job! Your task management looks balanced. Keep maintaining this productive workflow.',
      action: '',
      priority: 'low',
      category: 'productivity'
    });
  }

  return suggestions;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const projectId = request.headers.get('x-project-id'); // Add project support
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Initialize MongoDB connection
    await initializeMongoDB();
    const { mongoDb } = await getMongoDb();
    
    if (!mongoDb) {
      console.error('Database connection failed - mongoDb is undefined');
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          aiConnected: false,
          suggestions: []
        },
        { status: 500 }
      );
    }
    
    const tasksCollection = mongoDb.collection('tasks');
    
    // Get user's tasks (filter by project if projectId provided)
    const tasksQuery = projectId 
      ? await tasksCollection.find({ userId, projectId }).toArray()
      : await tasksCollection.find({ userId }).toArray();
    const tasks: Task[] = tasksQuery.map((task: any) => ({
      ...task,
      id: task._id.toString(),
    }));

    // Get Google AI API key (prioritize project AI over personal AI)
    const apiKey = await getGoogleAIKey(userId, projectId || undefined);
    const aiConnected = !!apiKey;

    console.log('AI Connection status:', aiConnected ? 'Connected' : 'Not connected');
    console.log('API Key available:', !!apiKey);

    let teamMembers: any[] = [];
    let teamWorkloadData: any = {};

    // If this is a project context, fetch team member data
    if (projectId && projectId !== "personal") {
      try {
        // Get project members
        const db = await import('@/lib/firebase').then(m => m.db);
        const { doc, getDoc } = await import('firebase/firestore');
        
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          const memberIds = projectData.members || [projectData.ownerId];
          
          // Fetch member details and workload
          const memberPromises = memberIds.map(async (memberId: string) => {
            try {
              const userRef = doc(db, "users", memberId);
              const userSnap = await getDoc(userRef);
              
              let memberData = {
                id: memberId,
                name: "Unknown User",
                email: "",
                role: memberId === projectData.ownerId ? "owner" : "member",
                taskLimit: 10, // Default task limit
                assignedTasks: 0,
                completedThisWeek: 0,
                overdueTasks: 0
              };
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                memberData.name = userData.displayName || userData.name || "Unknown User";
                memberData.email = userData.email || "";
                memberData.taskLimit = userData.taskLimit || 10;
              }
              
              // Get task counts for this member
              const memberTasks = await tasksCollection.find({ 
                projectId, 
                assigneeId: memberId 
              }).toArray();
              
              memberData.assignedTasks = memberTasks.filter(t => t.status !== 'completed').length;
              
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              memberData.completedThisWeek = memberTasks.filter(t => 
                t.status === 'completed' && 
                t.completedAt && 
                new Date(t.completedAt) >= oneWeekAgo
              ).length;
              
              const now = new Date();
              memberData.overdueTasks = memberTasks.filter(t => 
                t.status !== 'completed' && 
                t.dueDate && 
                new Date(t.dueDate) < now
              ).length;
              
              return memberData;
            } catch (error) {
              console.error(`Error fetching member ${memberId}:`, error);
              return {
                id: memberId,
                name: "Unknown User",
                email: "",
                role: memberId === projectData.ownerId ? "owner" : "member",
                taskLimit: 10,
                assignedTasks: 0,
                completedThisWeek: 0,
                overdueTasks: 0
              };
            }
          });
          
          teamMembers = await Promise.all(memberPromises);
          
          // Create team workload summary
          teamWorkloadData = {
            totalMembers: teamMembers.length,
            averageWorkload: teamMembers.reduce((sum, m) => sum + (m.assignedTasks / m.taskLimit), 0) / teamMembers.length,
            overloadedMembers: teamMembers.filter(m => m.assignedTasks >= m.taskLimit * 0.9),
            underutilizedMembers: teamMembers.filter(m => m.assignedTasks < m.taskLimit * 0.3),
            membersWithOverdueTasks: teamMembers.filter(m => m.overdueTasks > 0)
          };
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    }

    // Use AI-powered suggestions if key available
    const suggestions = aiConnected 
      ? await generateAISuggestions(tasks, apiKey, projectId || undefined, teamMembers, teamWorkloadData)
      : generateSmartAnalysis(tasks, projectId || undefined, teamMembers, teamWorkloadData);
    
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < new Date();
    });
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= new Date() && dueDate <= threeDaysFromNow;
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 6), // Limit to 6 suggestions
      aiConnected,
      insights: {
        totalTasks: tasks.length,
        activeTasks: activeTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingDeadlines: upcomingTasks.length
      }
    });

  } catch (error) {
    console.error("Error generating AI task suggestions:", error);
    
    // Return fallback suggestions when database fails
    const fallbackSuggestions = [
      {
        id: 'fallback-1',
        type: 'optimization' as const,
        title: 'AI Not Connected',
        description: 'Connect your Google AI API key in settings to get personalized AI suggestions.',
        action: 'Go to Settings → AI Configuration',
        priority: 'medium' as const,
        category: 'productivity' as const
      },
      {
        id: 'fallback-2',
        type: 'priority' as const,
        title: 'Organize Your Workflow',
        description: 'Set priorities and due dates for better task management.',
        action: 'Add priorities and deadlines to your tasks',
        priority: 'low' as const,
        category: 'productivity' as const
      }
    ];
    
    return NextResponse.json({
      success: false,
      suggestions: fallbackSuggestions,
      aiConnected: false,
      insights: {
        totalTasks: 0,
        overdueTasks: 0,
        upcomingDeadlines: 0,
        highPriorityTasks: 0,
        completionRate: 0
      },
      error: "Database temporarily unavailable"
    });
  }
}
