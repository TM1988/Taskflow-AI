'use client'

import { useSettingsStore } from '../store'
import Header from '@/components/Header'
import { RiUser3Line, RiMailLine, RiMoonLine, RiSunLine, RiGithubLine, RiGitlabLine, RiNotificationLine } from 'react-icons/ri'

export default function Settings() {
  const { theme, setTheme, name, setName, email, setEmail } = useSettingsStore()

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
            <div className="lg:col-span-2 space-y-8">
              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <div className="relative">
                      <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <div className="relative">
                      <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                  <button className="button-primary">Save Changes</button>
                </div>
              </div>

              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Integrations</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <RiGithubLine className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">GitHub</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connected</p>
                      </div>
                    </div>
                    <button className="button-secondary">Disconnect</button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <RiGitlabLine className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">GitLab</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                      </div>
                    </div>
                    <button className="button-primary">Connect</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
                <div className="space-y-4">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        theme === '
light'
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <RiSunLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <RiMoonLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <RiNotificationLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}