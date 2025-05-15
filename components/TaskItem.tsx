'use client'

import { useContext } from 'react'
import { format } from 'date-fns'
import { TodoContext, Task } from '@/app/providers'

export default function TaskItem({ task }: { task: Task }) {
  const { toggleTask, deleteTask } = useContext(TodoContext)

  return (
    <div className={`task-container p-2 mb-2 task-priority-${task.priority}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleTask(task.id)}
          className="mt-1"
        />
        <div className="flex-1 text-sm">
          <div className="flex justify-between items-start">
            <span className={`font-mono ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-gray-400 hover:text-gray-600 px-1"
            >
              x
            </button>
          </div>
          <div className="text-xs text-gray-500 font-mono mt-1">
            {format(new Date(task.createdAt), 'MM/dd/yy HH:mm')} | {task.priority}
          </div>
        </div>
      </div>
    </div>
  )
}