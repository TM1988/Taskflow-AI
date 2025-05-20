'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { RiCheckboxCircleLine, RiTimeLine, RiAlarmLine, RiBarChartBoxLine } from 'react-icons/ri'

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])
  
  // Mock data for dashboard
  const stats = [
    { name: 'Completed Tasks', value: 12, icon: RiCheckboxCircleLine, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { name: 'In Progress', value: 5, icon: RiTimeLine, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { name: 'Upcoming', value: 8, icon: RiAlarmLine, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { name: 'Total Tasks', value: 25, icon: RiBarChartBoxLine, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' }
  ]
  
  // Recent activity mock data
  const activities = [
    { action: 'Completed task', task: 'Update user authentication', time: '2 hours ago', user: 'Tanish' },
    { action: 'Added new task', task: 'Design dashboard layout', time: '5 hours ago', user: 'Tanish' },
    { action: 'Moved task', task: 'Implement API integration', time: 'Yesterday', user: 'Tanish' },
    { action: 'Updated task', task: 'Fix sidebar navigation', time: '2 days ago', user: 'Tanish' }
  ]
  
  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.displayName || 'Tanish'}`} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title">Dashboard</h1>
            <p className="section-subtitle">Welcome back, {user?.displayName || 'Tanish'}</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="chart-container p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mr-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Recent Activity */}
          <div className="chart-container">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}: <span className="text-primary">{activity.task}</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time} by {activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
