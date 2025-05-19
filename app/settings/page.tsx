'use client'

import { useState } from 'react'
import { useSettingsStore } from '../store'
import Header from '@/components/Header'
import { RiUser3Line, RiMailLine, RiMoonLine, RiSunLine, RiGithubLine, RiGitlabLine, RiNotificationLine, RiKeyLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'

export default function Settings() {
  const { theme, setTheme, name, setName, email, setEmail, apiKeys, setApiKey } = useSettingsStore()
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showGitHubKey, setShowGitHubKey] = useState(false)
  const [openAIKey, setOpenAIKey] = useState(apiKeys.openai || '')
  const [githubKey, setGitHubKey] = useState(apiKeys.github || '')

  const handleSaveAPIKeys = () => {
    if (openAIKey) setApiKey('openai', openAIKey)
    if (githubKey) setApiKey('github', githubKey)
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title">Settings</h1>
            <p className="section-subtitle">Manage your account settings and preferences</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Previous settings sections */}
            
            <div className="lg:col-span-2">
              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">API Keys</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">OpenAI API Key</label>
                    <div className="relative">
                      <RiKeyLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showOpenAIKey ? "text" : "password"}
                        value={openAIKey}
                        onChange={(e) => setOpenAIKey(e.target.value)}
                        placeholder="Enter your OpenAI API key"
                        className="input-field pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOpenAIKey ? (
                          <RiEyeOffLine className="w-5 h-5" />
                        ) : (
                          <RiEyeLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">GitHub API Key</label>
                    <div className="relative">
                      <RiKeyLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showGitHubKey ? "text" : "password"}
                        value={githubKey}
                        onChange={(e) => setGitHubKey(e.target.value)}
                        placeholder="Enter your GitHub API key"
                        className="input-field pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGitHubKey(!showGitHubKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showGitHubKey ? (
                          <RiEyeOffLine className="w-5 h-5" />
                        ) : (
                          <RiEyeLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button onClick={handleSaveAPIKeys} className="button-primary">
                    Save API Keys
                  </button>
                </div>
              </div>
            </div>

            {/* Rest of the settings sections */}
          </div>
        </div>
      </div>
    </div>
  )
}