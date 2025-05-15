'use client'

import TaskItem from './TaskItem'
import { Task } from '@/app/providers'

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-100">
        <p className="text-gray-500 font-mono text-sm">No tasks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}