'use client'

import { useContext } from 'react'
import { format } from 'date-fns'
import { TodoContext, Task } from '@/app/providers'
import { RiCheckLine, RiCloseLine } from 'react-icons/ri'

export default function TaskItem({ task }: { task: Task }) {
  const { toggleTask = () => {}, deleteTask = () => {} } = useContext(TodoContext) || {}

  const priorityColors = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    low: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  }

  return (
    <div className={`task-container p-4 ${task.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleTask(task.id)}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500'
          }`}
        >
          {task.completed && <RiCheckLine className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${
                task.completed
                  ? 'text-gray-400 dark:text-gray-500 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {task.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}