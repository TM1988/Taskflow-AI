'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

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

  const statusData = [
    { name: 'To Do', value: stats.todo },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Review', value: stats.review },
    { name: 'Done', value: stats.done },
  ]

  const priorityData = [
    { name: 'High', value: stats.highPriority },
    { name: 'Medium', value: stats.mediumPriority },
    { name: 'Low', value: stats.lowPriority },
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="p-8">
      <h2 className="text-xl mb-6 text-gray-500 dark:text-gray-400">Analytics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</h3>
          <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">To Do</h3>
          <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{stats.todo}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">In Progress</h3>
          <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Completed</h3>
          <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 mt-2">{stats.done}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg mb-6 text-gray-500 dark:text-gray-400">Task Status Distribution</h3>
          <div className="flex justify-center">
            <PieChart width={400} height={300}>
              <Pie
                data={statusData}
                cx={200}
                cy={150}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg mb-6 text-gray-500 dark:text-gray-400">Task Priority Distribution</h3>
          <div className="flex justify-center">
            <BarChart width={400} height={300} data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </div>
        </div>
      </div>
    </div>
  )
}