'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'

export default function Analytics() {
  const { tasks = [] } = useContext(TodoContext) || {}

  const stats = {
    total: tasks.length,
    todo: tasks.filter(task => task.status === 'todo').length,
    inProgress: tasks.filter(task => task.status === 'inProgress').length,
    review: tasks.filter(task => task.status === 'review').length,
    done: tasks.filter(task => task.completed).length,
    highPriority: tasks.filter(task => task.priority === 'high').length,
    mediumPriority: tasks.filter(task => task.priority === 'medium').length,
    lowPriority: tasks.filter(task => task.priority === 'low').length,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl mb-6">Analytics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">To Do</h3>
          <p className="text-2xl font-bold">{stats.todo}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">In Progress</h3>
          <p className="text-2xl font-bold">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">In Review</h3>
          <p className="text-2xl font-bold">{stats.review}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Completed</h3>
          <p className="text-2xl font-bold">{stats.done}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">High Priority</h3>
          <p className="text-2xl font-bold">{stats.highPriority}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Medium Priority</h3>
          <p className="text-2xl font-bold">{stats.mediumPriority}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Low Priority</h3>
          <p className="text-2xl font-bold">{stats.lowPriority}</p>
        </div>
      </div>
    </div>
  )
}