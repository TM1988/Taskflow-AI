'use client'

import { useContext, useState } from 'react'
import Header from './Header'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import FilterTabs from './FilterTabs'
import SearchBar from './SearchBar'
import { TodoContext } from '@/app/providers'
import { RiTaskLine, RiCheckLine, RiGitPullRequestLine, RiTimeLine, RiAddLine } from 'react-icons/ri'

export default function Dashboard() {
  const { tasks = [], filter = 'all', searchQuery = '' } = useContext(TodoContext) || {}
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  
  const filteredTasks = tasks.filter(task => {
    const statusMatch = 
      filter === 'all' ? true :
      filter === 'active' ? !task.completed :
      task.completed
    
    const queryMatch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    return statusMatch && queryMatch
  })

  const stats = {
    openTasks: tasks.filter(t => !t.completed).length,
    completedTasks: tasks.filter(t => t.completed).length,
    openPRs: 7,
    timeSpent: '32.5h'
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title">Dashboard</h1>
            <p className="section-subtitle">Your AI-powered project insights and management overview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.openTasks}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <RiTaskLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">+4% from last sprint</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.completedTasks}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <RiCheckLine className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% from last sprint</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open PRs</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.openPRs}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <RiGitPullRequestLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">-2 from yesterday</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time Spent</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.timeSpent}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <RiTimeLine className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">On track</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="chart-container">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">AI Suggestions</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <RiTaskLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Prioritize reviewing Alice's PR</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This PR addresses a critical bug and has been waiting for 2 days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">GitHub Connection</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <RiCheckLine className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">GitHub Connected Successfully</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your repositories are now synced</p>
                </div>
              </div>
              <button className="button-secondary w-full">Disconnect GitHub</button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
              <button 
                onClick={() => setShowNewTaskForm(true)}
                className="button-primary flex items-center gap-2"
              >
                <RiAddLine className="w-5 h-5" />
                New Task
              </button>
            </div>

            {showNewTaskForm && (
              <div className="chart-container mb-6">
                <TaskForm onComplete={() => setShowNewTaskForm(false)} />
              </div>
            )}

            <SearchBar />
            <FilterTabs />
            <TaskList tasks={filteredTasks} />
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {filteredTasks.length} tasks
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}