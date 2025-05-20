'use client'

import { useState, useContext, useEffect } from 'react'
import { TodoContext } from '@/app/providers'
import { RiAddLine, RiErrorWarningLine } from 'react-icons/ri'

interface Props {
  onComplete?: () => void
}

export default function TaskForm({ onComplete }: Props) {
  const [newTask, setNewTask] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const todoContext = useContext(TodoContext)
  const { addTask } = todoContext || {}
  
  useEffect(() => {
    if (!todoContext) {
      console.warn('TodoContext is not available!')
      setError('Context not available')
    } else if (!addTask) {
      console.warn('addTask function is not available!')
      setError('Task creation unavailable')
    } else {
      setError('')
    }
  }, [todoContext, addTask])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted', { newTask, priority, description })
    
    if (!newTask.trim()) {
      console.warn('Task title is empty')
      return
    }
    
    if (!addTask) {
      console.error('addTask function is not available')
      setError('Cannot create task: system error')
      return
    }
    
    try {
      // We'll assume the addTask function can handle the due date
      // You may need to update the actual function in the context
      addTask(newTask.trim(), priority, description.trim() || undefined, dueDate || undefined)
      console.log('Task successfully added')
      setNewTask('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setError('')
      onComplete?.()
    } catch (err) {
      console.error('Error adding task:', err)
      setError('Failed to create task')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
          <RiErrorWarningLine className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Title"
          className="search-input w-full border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
          className="search-input w-full border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          className="search-input w-full h-24 resize-none border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="search-input w-full border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
        />
      </div>
      
      <div className="flex justify-end pt-2">
        <button type="submit" className="button-primary px-6 flex items-center gap-2">
          <RiAddLine className="w-5 h-5" />
          Add Task
        </button>
      </div>
    </form>
  )
}