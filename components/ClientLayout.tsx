'use client'

import { useSettingsStore } from '@/app/store'
import Sidebar from './Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme)
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-20 lg:ml-64 transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}