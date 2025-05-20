'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

// Define the Task type
export interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  description?: string
  dueDate?: string
  createdAt: string
}

// Define the context type
interface TodoContextType {
  tasks: Task[]
  addTask: (title: string, priority: 'low' | 'medium' | 'high', description?: string, dueDate?: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  filter: 'all' | 'active' | 'completed'
  setFilter: (filter: 'all' | 'active' | 'completed') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

// Create the context
export const TodoContext = createContext<TodoContextType | null>(null)

// Create a provider component
export function Providers({ children }: { children: React.ReactNode }) {
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks')
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (error) {
        console.error('Error parsing saved tasks:', error)
        setTasks([])
      }
    }
  }, [])
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])
  
  // Function to add a new task
  const addTask = (title: string, priority: 'low' | 'medium' | 'high', description?: string, dueDate?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      priority,
      description,
      dueDate,
      createdAt: new Date().toISOString()
    }
    setTasks([...tasks, newTask])
  }
  
  // Function to toggle a task's completed status
  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }
  
  // Function to delete a task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }
  
  // Function to update a task
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ))
  }
  
  // Provide the context value
  const contextValue: TodoContextType = {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery
  }
  
  return (
    <AuthProvider>
      <TodoContext.Provider value={contextValue}>
        {children}
      </TodoContext.Provider>
    </AuthProvider>
  )
}

// Custom hook to use the todo context
export const useTodo = () => {
  const context = useContext(TodoContext)
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider')
  }
  return context
}