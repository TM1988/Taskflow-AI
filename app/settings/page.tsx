'use client'

import { useSettingsStore } from '../store'

export default function Settings() {
  const { theme, setTheme, name, setName, email, setEmail } = useSettingsStore()

  return (
    <div className="p-8">
      <h2 className="text-xl mb-6 text-gray-500 dark:text-gray-400">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg mb-6 text-gray-500 dark:text-gray-400">Profile</h3>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field mt-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-2"
              />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg mb-6 text-gray-500 dark:text-gray-400">Appearance</h3>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                className="input-field mt-2"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}