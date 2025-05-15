'use client'

import { useContext } from 'react'
import Header from './Header'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import FilterTabs from './FilterTabs'
import SearchBar from './SearchBar'
import { TodoContext } from '@/app/providers'

export default function Dashboard() {
  const { tasks = [], filter = 'all', searchQuery = '' } = useContext(TodoContext) || {}
  
  const filteredTasks = tasks.filter(task => {
    const statusMatch = 
      filter === 'all' ? true :
      filter === 'active' ? !task.completed :
      task.completed
    
    const queryMatch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    return statusMatch && queryMatch
  })

  return (
    <div>
      <Header />
      <div className="p-4">
        <SearchBar />
        <TaskForm />
        <FilterTabs />
        <div className="max-w-2xl mx-auto">
          <TaskList tasks={filteredTasks} />
          <div className="text-center text-gray-500 text-sm font-mono">
            {filteredTasks.length} tasks
          </div>
        </div>
      </div>
    </div>
  )
}