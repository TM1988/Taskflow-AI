'use client'

import { createContext, useState, useEffect, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AuthProvider } from '@/contexts/AuthContext'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'inProgress' | 'review' | 'done'
  description?: string
  dueDate?: string
  comments?: Comment[]
}

interface Comment {
  id: string
  text: string
  author: string
  createdAt: string
}

interface TodoContextType {
  tasks: Task[]
  addTask: (title: string, priority: 'low' | 'medium' | 'high', description?: string, dueDate?: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTaskStatus: (id: string, status: 'todo' | 'inProgress' | 'review' | 'done') => void
  updateTask: (id: string, updates: Partial<Task>) => void
  filter: 'all' | 'active' | 'completed'
  setFilter: (filter: 'all' | 'active' | 'completed') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const TodoContext = createContext<TodoContextType>({
  tasks: [],
  addTask: () => {},
  toggleTask: () => {},
  deleteTask: () => {},
  updateTaskStatus: () => {},
  updateTask: () => {},
  filter: 'all',
  setFilter: () => {},
  searchQuery: '',
  setSearchQuery: () => {}
} as TodoContextType)

export function TodoProviders({ children }: { children: ReactNode }) {
  // Initialize tasks with an empty array to avoid hydration errors
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Flag to track if component is mounted (client-side only)
  const [isClient, setIsClient] = useState(false);

  const toggleTask = (id: string) => {
    try {
      // Log the toggle action for debugging
      console.log('Toggling task completion:', { id });
      
      // Update tasks using setTasks
      setTasks((prevTasks: Task[]) => {
        const updatedTasks = prevTasks.map((task: Task) => {
          if (task.id === id) {
            // Toggle completion and update status accordingly
            const completed = !task.completed;
            const status = completed ? 'done' : 'todo' as 'todo' | 'inProgress' | 'review' | 'done';
            
            // Create a deep copy with updated values
            return { 
              ...task, 
              completed, 
              status 
            };
          }
          return task;
        });
        
        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Set isClient to true once component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load tasks from localStorage only on the client-side
  useEffect(() => {
    if (!isClient) return;
    
    const savedTasks = localStorage.getItem('tasks')
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (error) {
        console.error('Failed to parse saved tasks', error)
        setTasks([])
      }
    } else {
      const initialTasks: Task[] = [
        {
          id: uuidv4(),
          title: 'Complete project dashboard',
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'high',
          status: 'todo',
          description: 'Implement the main dashboard with all required features and analytics.',
          comments: []
        },
        {
          id: uuidv4(),
          title: 'Review pull requests',
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'medium',
          status: 'inProgress',
          description: 'Review and merge pending pull requests from the team.',
          comments: []
        },
        {
          id: uuidv4(),
          title: 'Update documentation',
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'low',
          status: 'review',
          description: 'Update project documentation with latest changes and features.',
          comments: []
        }
      ]
      setTasks(initialTasks)
      localStorage.setItem('tasks', JSON.stringify(initialTasks))
    }
  }, [isClient])

  // This useEffect is removed as it's redundant with the one above

  // Save tasks to localStorage whenever they change, but only on client-side
  useEffect(() => {
    if (!isClient) return;
    
    try {
      console.log('Saving tasks to localStorage:', tasks.length, 'tasks');
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks, isClient])

  const addTask = (title: string, priority: 'low' | 'medium' | 'high', description?: string, dueDate?: string) => {
    try {
      const newTask: Task = {
        id: uuidv4(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        priority,
        status: 'todo',
        description,
        dueDate,
        comments: []
      };
      
      console.log('Adding new task:', newTask);
      setTasks([...tasks, newTask]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  // toggleTask function is already defined above

  const updateTaskStatus = (id: string, status: 'todo' | 'inProgress' | 'review' | 'done') => {
    try {
      // Log the status update for debugging
      console.log('Updating task status:', { id, status });
      
      // Create new tasks array with the updated status
      const updatedTasks = tasks.map((task) => {
        if (task.id === id) {
          // Create a deep copy with updated status
          const updatedTask = { 
            ...task, 
            status, 
            completed: status === 'done' 
          };
          
          // Log the specific task update
          console.log('Task status updated:', { 
            id, 
            oldStatus: task.status, 
            newStatus: status,
            wasCompleted: task.completed,
            isNowCompleted: status === 'done'
          });
          
          return updatedTask;
        }
        return task;
      });
      
      // Update the state
      setTasks(updatedTasks);
      
      // Save to localStorage immediately to ensure persistence
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      console.log('Tasks saved to localStorage after status update');
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    try {
      // Log what we're updating for debugging
      console.log('Updating task in context:', { id, updates });
      
      // Create new tasks array with the updated task
      const updatedTasks = tasks.map((task: Task) => {
        if (task.id === id) {
          // Create a deep copy to avoid reference issues
          const updatedTask = { ...task, ...updates };
          
          // Ensure the due date is properly handled
          if (updates.dueDate !== undefined) {
            updatedTask.dueDate = updates.dueDate;
          }
          
          // Log the specific task update
          console.log('Task updated:', { before: task, after: updatedTask });
          
          return updatedTask;
        }
        return task;
      });
      
      // Update the state
      setTasks(updatedTasks);
      
      // Save to localStorage immediately to ensure persistence
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      console.log('Tasks saved to localStorage after update');
      
      // Force a re-render to ensure UI updates
      setTimeout(() => {
        console.log('UI updated after task update');
      }, 10);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  return (
    <TodoContext.Provider
      value={{
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        updateTaskStatus,
        updateTask,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </TodoContext.Provider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TodoProviders>
        {children}
      </TodoProviders>
    </AuthProvider>
  )
}