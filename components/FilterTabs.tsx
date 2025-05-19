'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'

export default function FilterTabs() {
  const { filter, setFilter } = useContext(TodoContext)

  return (
    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
      <button
        onClick={() => setFilter('all')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          filter === 'all'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setFilter('active')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          filter === 'active'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Active
      </button>
      <button
        onClick={() => setFilter('completed')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          filter === 'completed'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Completed
      </button>
    </div>
  )
}