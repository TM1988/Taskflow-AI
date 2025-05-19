'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { RiGitRepositoryLine, RiStarLine, RiGitPullRequestLine, RiGitBranchLine } from 'react-icons/ri'

interface Repository {
  name: string
  description: string
  stars: number
  lastUpdated: string
  prs: number
  branches: number
}

export default function Repositories() {
  const [isConnected, setIsConnected] = useState(false)

  const mockRepos: Repository[] = [
    {
      name: 'taskflow-ai',
      description: 'AI-powered project management dashboard',
      stars: 128,
      lastUpdated: '2024-01-15',
      prs: 5,
      branches: 3
    },
    {
      name: 'react-components',
      description: 'Collection of reusable React components',
      stars: 45,
      lastUpdated: '2024-01-10',
      prs: 2,
      branches: 2
    },
    {
      name: 'utils-library',
      description: 'Common utility functions for JavaScript projects',
      stars: 23,
      lastUpdated: '2024-01-05',
      prs: 1,
      branches: 1
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title">Repositories</h1>
            <p className="section-subtitle">Connect and manage your GitHub repositories</p>
          </div>
          
          {!isConnected ? (
            <div className="chart-container">
              <div className="max-w-md mx-auto text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RiGitRepositoryLine className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connect GitHub</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Connect your GitHub account to sync repositories and enable automatic task tracking based on your commits and pull requests.
                </p>
                <button
                  onClick={() => setIsConnected(true)}
                  className="button-primary"
                >
                  Connect GitHub
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {mockRepos.map(repo => (
                <div key={repo.name} className="chart-container">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <RiGitRepositoryLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{repo.name}</h3>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{repo.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <RiStarLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{repo.stars}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiGitPullRequestLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{repo.prs} PRs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiGitBranchLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{repo.branches} branches</span>
                        </div>
                      </div>
                      <button className="button-secondary text-sm">View Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}