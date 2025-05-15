'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'

export default function FilterTabs() {
  const { filter, setFilter } = useContext(TodoContext)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-1 mb-4 text-sm">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 font-mono ${
            filter === 'all' 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-2 py-1 font-mono ${
            filter === 'active'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-2 py-1 font-mono ${
            filter === 'completed'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Done
        </button>
      </div>
    </div>
  )
}