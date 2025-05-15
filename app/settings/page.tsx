'use client'

import { useSettingsStore } from '../store'

export default function Settings() {
  const { theme, setTheme, name, setName, email, setEmail } = useSettingsStore()

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl mb-6 text-gray-500 dark:text-gray-400">Settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg">Profile</h3>
          <div className="space-y-2">
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg">Appearance</h3>
          <div className="space-y-2">
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                className="input-field"
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