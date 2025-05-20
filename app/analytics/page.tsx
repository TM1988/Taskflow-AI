'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Header from '@/components/Header'
import { RiTaskLine, RiTimeLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri'

export default function Analytics() {
  const { tasks = [] } = useContext(TodoContext) || {}

  // Since we don't have a status field, we'll use the completed field to determine status
  // We'll consider all incomplete tasks as 'todo' for simplicity
  const stats = {
    total: tasks.length,
    todo: tasks.filter(task => !task.completed).length,
    inProgress: 0, // We don't have this status in our current model
    review: 0, // We don't have this status in our current model
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="min-h-screen">
      <Header title="Analytics" subtitle="Track your project progress and team performance" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title">Analytics</h1>
            <p className="section-subtitle">Track your project progress and team performance</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <RiTaskLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <RiTimeLine className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.done}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <RiCheckLine className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">High Priority</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.highPriority}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <RiErrorWarningLine className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Task Status Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent, x, y, midAngle }) => {
                        const radius = 130;
                        const cx = x;
                        const cy = y;
                        const sin = Math.sin(-midAngle * Math.PI / 180);
                        const cos = Math.cos(-midAngle * Math.PI / 180);
                        const mx = cx + radius * cos;
                        const my = cy + radius * sin;
                        return (
                          <text 
                            x={mx} 
                            y={my} 
                            fill="#666" 
                            textAnchor={cos > 0 ? 'start' : 'end'} 
                            dominantBaseline="central"
                            fontSize={12}
                          >
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Task Priority Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}