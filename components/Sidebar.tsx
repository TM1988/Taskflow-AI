'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Board', href: '/board' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Repositories', href: '/repositories' },
  { name: 'Team', href: '/team' },
  { name: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-mono text-gray-900 dark:text-gray-100">
                Taskflow-AI
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                v1.0
              </p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isCollapsed ? <RiMenuUnfoldLine size={20} /> : <RiMenuFoldLine size={20} />}
          </button>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${isCollapsed ? 'text-center' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                {isCollapsed ? item.name.charAt(0) : item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}