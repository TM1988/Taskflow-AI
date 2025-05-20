'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { RiCheckboxCircleLine, RiTimeLine, RiInboxLine, RiBarChartBoxLine } from 'react-icons/ri'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    todo: 0,
    total: 0
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch task statistics
  useEffect(() => {
    if (user) {
      // This would typically fetch from Firestore
      // For now, we'll use dummy data
      setStats({
        completed: 12,
        inProgress: 5,
        todo: 8,
        total: 25
      })
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {user?.displayName || 'Tanish'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here's an overview of your tasks
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mr-4">
                <RiInboxLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mr-4">
                <RiCheckboxCircleLine className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</h3>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3 mr-4">
                <RiTimeLine className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</h3>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3 mr-4">
                <RiBarChartBoxLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">To Do</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todo}</h3>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/board" 
                className="flex items-center justify-center p-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
              >
                <span className="font-medium">Go to Board</span>
              </Link>
              
              <Link 
                href="/settings" 
                className="flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <span className="font-medium">Settings</span>
              </Link>
              
              <Link 
                href="/analytics" 
                className="flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <span className="font-medium">View Analytics</span>
              </Link>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Task "Implement Authentication" moved to Completed</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</span>
                </div>
              </div>
              
              <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-800 dark:text-gray-200">New task "Fix Theme Selector" added</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Yesterday</span>
                </div>
              </div>
              
              <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Task "Update User Profile" moved to In Progress</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
