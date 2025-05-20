'use client'

'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'

// Paths that should not have the sidebar
const noSidebarPaths = [
  '/login',
  '/signup',
  '/forgot-password',
  '/onboarding'
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const showSidebar = !noSidebarPaths.includes(pathname)
  
  return (
    <div className={user?.theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {showSidebar && <Sidebar />}
          <main className={`flex-1 ${showSidebar ? 'ml-64' : ''} transition-all duration-300`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}