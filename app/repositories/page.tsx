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
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl mb-6 text-gray-500 dark:text-gray-400">Repositories</h2>
      
      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Connect your GitHub account to sync repositories</p>
          <button
            onClick={() => setIsConnected(true)}
            className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Connect GitHub
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mockRepos.map(repo => (
            <div key={repo.name} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">{repo.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{repo.description}</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ⭐ {repo.stars}
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Last updated: {repo.lastUpdated}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}