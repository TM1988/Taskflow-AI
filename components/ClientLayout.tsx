'use client'

import { useSettingsStore } from '@/app/store'
import Sidebar from './Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme)
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}