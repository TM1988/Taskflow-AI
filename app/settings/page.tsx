'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/AuthContext'
import { RiMoonLine, RiSunLine, RiComputerLine, RiSaveLine, RiKey2Line, RiMailLine, RiUserLine } from 'react-icons/ri'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  
  // Debug theme state
  useEffect(() => {
    console.log('Current theme:', theme)
  }, [theme])
  const { user, updateUserProfile, logOut } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  useEffect(() => {
    if (user) {
      setName(user.displayName || '')
      setApiKey(user.apiKey || '')
    }
  }, [user])
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      await updateUserProfile({
        displayName: name,
        apiKey: apiKey
      })
      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleLogout = async () => {
    try {
      await logOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  
  return (
    <div className="min-h-screen">
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5">
                    <RiMailLine className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <span className="text-gray-800 dark:text-gray-200">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSave}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="Your name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Google AI Studio API Key (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="input-field"
                      placeholder="API Key"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used for AI-powered features. You can get your API key from Google AI Studio.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Setting theme to light in settings');
                      setTheme('light');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    } transition-all duration-200 hover:border-blue-500`}
                  >
                    <RiSunLine className="w-6 h-6 mb-2" />
                    <span>Light {theme === 'light' ? '(active)' : ''}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Setting theme to dark in settings');
                      setTheme('dark');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    } transition-all duration-200 hover:border-blue-500`}
                  >
                    <RiMoonLine className="w-6 h-6 mb-2" />
                    <span>Dark {theme === 'dark' ? '(active)' : ''}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Setting theme to system');
                      setTheme('system');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${theme === 'system' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} 
                      transition-all duration-200 hover:border-blue-500`}
                  >
                    <RiComputerLine className="w-6 h-6 mb-2" />
                    <span>System {theme === 'system' ? '(active)' : ''}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {message.text}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="button-secondary"
              >
                Log Out
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="button-primary flex items-center gap-2"
              >
                <RiSaveLine className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}