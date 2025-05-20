'use client'

'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { RiMoonLine, RiSunLine, RiNotificationLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'

export default function Settings() {
  const { user, updateUserProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || 'Tanish')
      setEmail(user.email || '')
      setTheme(user.theme || 'system')
      setApiKey(user.apiKey || '')
    }
  }, [user])

  const handleSaveSettings = async () => {
    setLoading(true)
    setSuccess(false)
    setError('')
    
    try {
      // Prepare update data
      const updateData: any = {
        displayName,
        theme
      }
      
      // Only add apiKey if it's provided
      if (apiKey.trim() !== '') {
        updateData.apiKey = apiKey
      }
      
      await updateUserProfile(updateData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Settings update error:', err)
      setError(err.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
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
            <div className="lg:col-span-2">
              <div className="chart-container mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="input-field bg-gray-50 dark:bg-gray-700"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="chart-container mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Theme Settings</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setTheme('light');
                      // Apply theme immediately
                      document.documentElement.classList.remove('dark');
                    }}
                    className={`flex-1 p-4 rounded-lg border ${theme === 'light' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700'} flex items-center justify-center gap-3`}
                  >
                    <RiSunLine className={`w-5 h-5 ${theme === 'light' ? 'text-primary' : 'text-gray-500 dark:text-white'}`} />
                    <span className={`font-medium ${theme === 'light' ? 'text-primary' : 'text-gray-700 dark:text-white'}`}>Light</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTheme('dark');
                      // Apply theme immediately
                      document.documentElement.classList.add('dark');
                    }}
                    className={`flex-1 p-4 rounded-lg border ${theme === 'dark' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700'} flex items-center justify-center gap-3`}
                  >
                    <RiMoonLine className={`w-5 h-5 ${theme === 'dark' ? 'text-primary' : 'text-gray-500 dark:text-white'}`} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-gray-700 dark:text-white'}`}>Dark</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTheme('system');
                      // Apply theme immediately based on system preference
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if (prefersDark) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    }}
                    className={`flex-1 p-4 rounded-lg border ${theme === 'system' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700'} flex items-center justify-center gap-3`}
                  >
                    <RiNotificationLine className={`w-5 h-5 ${theme === 'system' ? 'text-primary' : 'text-gray-500 dark:text-white'}`} />
                    <span className={`font-medium ${theme === 'system' ? 'text-primary' : 'text-gray-700 dark:text-white'}`}>System</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">API Keys</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Google AI Studio API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Google AI Studio API key (optional)"
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? (
                          <RiEyeOffLine className="w-5 h-5" />
                        ) : (
                          <RiEyeLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Used for AI-powered features. You can skip this and add it later.
                    </p>
                  </div>

                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
                      Settings saved successfully!
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button 
                    onClick={handleSaveSettings} 
                    className="button-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
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