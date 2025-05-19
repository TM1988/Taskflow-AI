'use client'

import { useState, useContext } from 'react'
import { TodoContext } from '@/app/providers'
import { RiAddLine } from 'react-icons/ri'

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="What needs to be done?"
          className="search-input flex-1"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
          className="search-input w-32"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="button-primary px-6">
          <RiAddLine className="w-5 h-5" />
        </button>
      </div>
    </form>
  )
}