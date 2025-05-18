export const mockBoardData = {
  'todo': {
    title: 'To Do',
    color: 'blue',
    tasks: [
      {
        id: 'task-1',
        title: 'Implement GitHub OAuth integration',
        description: 'Add GitHub authentication to allow users to sign in with their GitHub accounts.',
        priority: 'high',
        tags: ['feature', 'auth'],
        dueDate: 'May 15',
        assignee: {
          name: 'Alice Chen',
          avatar: 'https://i.pravatar.cc/150?img=1',
          initials: 'AC',
        },
        commentCount: 3,
      },
      {
        id: 'task-2',
        title: 'Create repository dashboard views',
        description: 'Implement dashboard views to display repository statistics and metrics.',
        priority: 'medium',
        tags: ['feature', 'dashboard'],
        assignee: {
          name: 'Bob Smith',
          avatar: 'https://i.pravatar.cc/150?img=2',
          initials: 'BS',
        },
      },
      {
        id: 'task-3',
        title: 'Implement task priority algorithm',
        description: 'Create an AI algorithm that suggests task priorities based on project deadlines and dependencies.',
        priority: 'medium',
        tags: ['ai', 'algorithm'],
        dueDate: 'May 20',
      },
    ],
  },
  'in-progress': {
    title: 'In Progress',
    color: 'yellow',
    tasks: [
      {
        id: 'task-4',
        title: 'Build Kanban board UI component',
        description: 'Implement drag and drop functionality for the Kanban board.',
        priority: 'high',
        tags: ['ui', 'feature'],
        assignee: {
          name: 'Diana Wong',
          avatar: 'https://i.pravatar.cc/150?img=4',
          initials: 'DW',
        },
        commentCount: 5,
      },
      {
        id: 'task-5',
        title: 'Integrate commit history API',
        description: 'Connect to GitHub API to fetch and display commit history for repositories.',
        priority: 'medium',
        tags: ['api', 'github'],
        assignee: {
          name: 'Charlie Kim',
          avatar: 'https://i.pravatar.cc/150?img=3',
          initials: 'CK',
        },
        isBlocked: true,
      },
    ],
  },
  'review': {
    title: 'Review',
    color: 'purple',
    tasks: [
      {
        id: 'task-6',
        title: 'Implement dark mode',
        description: 'Add support for dark mode and theme switching.',
        priority: 'low',
        tags: ['ui', 'enhancement'],
        dueDate: 'May 12',
        assignee: {
          name: 'Bob Smith',
          avatar: 'https://i.pravatar.cc/150?img=2',
          initials: 'BS',
        },
        commentCount: 2,
      },
      {
        id: 'task-7',
        title: 'Create burndown chart component',
        description: 'Implement a burndown chart for visualizing sprint progress.',
        priority: 'medium',
        tags: ['ui', 'charts'],
        assignee: {
          name: 'Ethan Davis',
          avatar: 'https://i.pravatar.cc/150?img=5',
          initials: 'ED',
        },
      },
    ],
  },
  'done': {
    title: 'Done',
    color: 'green',
    tasks: [
      {
        id: 'task-8',
        title: 'Set up project scaffolding',
        description: 'Initialize project with Next.js, TypeScript, and TailwindCSS.',
        priority: 'high',
        tags: ['setup'],
        assignee: {
          name: 'Alice Chen',
          avatar: 'https://i.pravatar.cc/150?img=1',
          initials: 'AC',
        },
      },
      {
        id: 'task-9',
        title: 'Design database schema',
        description: 'Create database schema for storing project and task information.',
        priority: 'high',
        tags: ['database', 'planning'],
        assignee: {
          name: 'Bob Smith',
          avatar: 'https://i.pravatar.cc/150?img=2',
          initials: 'BS',
        },
        commentCount: 4,
      },
      {
        id: 'task-10',
        title: 'Create wireframes for UI',
        description: 'Design wireframes and mockups for the user interface.',
        priority: 'medium',
        tags: ['design', 'ui'],
        assignee: {
          name: 'Charlie Kim',
          avatar: 'https://i.pravatar.cc/150?img=3',
          initials: 'CK',
        },
      },
    ],
  },
};