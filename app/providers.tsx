'use client'

import { createContext, useState, useEffect, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'inProgress' | 'review' | 'done'
  description?: string
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
  addTask: (title: string, priority: 'low' | 'medium' | 'high', description?: string) => void
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
  setSearchQuery: () => {},
})

export function Providers({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
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
          description: 'Implement the main dashboard with all required features and analytics.'
        },
        {
          id: uuidv4(),
          title: 'Review pull requests',
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'medium',
          status: 'inProgress',
          description: 'Review and merge pending pull requests from the team.'
        },
        {
          id: uuidv4(),
          title: 'Update documentation',
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'low',
          status: 'review',
          description: 'Update project documentation with latest changes and features.'
        }
      ]
      setTasks(initialTasks)
      localStorage.setItem('tasks', JSON.stringify(initialTasks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  const addTask = (title: string, priority: 'low' | 'medium' | 'high', description?: string) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      status: 'todo',
      description
    }
    setTasks([...tasks, newTask])
  }

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed, status: task.completed ? 'todo' : 'done' } : task
      )
    )
  }

  const updateTaskStatus = (id: string, status: 'todo' | 'inProgress' | 'review' | 'done') => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, status, completed: status === 'done' } : task
      )
    )
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    )
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