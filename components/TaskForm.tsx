'use client'

import { useState, useContext } from 'react'
import { TodoContext } from '@/app/providers'

export default function TaskForm() {
  const [newTask, setNewTask] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const { addTask } = useContext(TodoContext)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      addTask(newTask.trim(), priority)
      setNewTask('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task"
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm text-gray-900 dark:text-gray-200"
        />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="px-2 py-1 border border-gray-300 dark:border-gray-700 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-mono text-sm"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  )
}