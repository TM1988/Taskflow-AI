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
}

interface TodoContextType {
  tasks: Task[]
  addTask: (title: string, priority: 'low' | 'medium' | 'high') => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTaskStatus: (id: string, status: 'todo' | 'inProgress' | 'review' | 'done') => void
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
          status: 'todo'
        },
        {
          id: uuidv4(),
          title: 'Buy groceries',
          completed: true,
          createdAt: new Date().toISOString(),
          priority: 'medium',
          status: 'done'
        },
        {
          id: uuidv4(),
          title: 'Call mom',
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'low',
          status: 'todo'
        },
      ]
      setTasks(initialTasks)
      localStorage.setItem('tasks', JSON.stringify(initialTasks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  const addTask = (title: string, priority: 'low' | 'medium' | 'high') => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      status: 'todo'
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