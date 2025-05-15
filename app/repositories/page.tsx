'use client'

import { useState } from 'react'

interface Repository {
  name: string
  description: string
  stars: number
  lastUpdated: string
}

export default function Repositories() {
  const [isConnected, setIsConnected] = useState(false)

  const mockRepos: Repository[] = [
    {
      name: 'taskflow-ai',
      description: 'AI-powered project management dashboard',
      stars: 128,
      lastUpdated: '2024-01-15'
    },
    {
      name: 'react-components',
      description: 'Collection of reusable React components',
      stars: 45,
      lastUpdated: '2024-01-10'
    },
    {
      name: 'utils-library',
      description: 'Common utility functions for JavaScript projects',
      stars: 23,
      lastUpdated: '2024-01-05'
    }
  ]

  return (
    <div className="p-8">
      <h2 className="text-xl mb-6 text-gray-500 dark:text-gray-400">Repositories</h2>
      
      {!isConnected ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
          <div className="max-w-md">
            <h3 className="text-lg mb-4 text-gray-700 dark:text-gray-200">Connect GitHub</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Connect your GitHub account to sync repositories and enable automatic task tracking based on your commits and pull requests.</p>
            <button
              onClick={() => setIsConnected(true)}
              className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Connect GitHub
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {mockRepos.map(repo => (
            <div key={repo.name} className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{repo.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{repo.description}</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ⭐ {repo.stars}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Last updated: {repo.lastUpdated}
                </span>
                <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}