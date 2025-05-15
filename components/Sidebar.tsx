'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  RiDashboardLine, 
  RiLayoutMasonryLine,
  RiPieChartLine,
  RiGitRepositoryLine,
  RiTeamLine,
  RiSettings3Line,
  RiMenuFoldLine,
  RiMenuUnfoldLine 
} from 'react-icons/ri'
import { useSettingsStore } from '@/app/store'

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const theme = useSettingsStore((state) => state.theme)

  const links = [
    { href: '/', icon: RiDashboardLine, label: 'Dashboard' },
    { href: '/board', icon: RiLayoutMasonryLine, label: 'Board' },
    { href: '/analytics', icon: RiPieChartLine, label: 'Analytics' },
    { href: '/repositories', icon: RiGitRepositoryLine, label: 'Repositories' },
    { href: '/team', icon: RiTeamLine, label: 'Team' },
    { href: '/settings', icon: RiSettings3Line, label: 'Settings' },
  ]

  const bgColor = theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-800'
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-gray-100'
  const iconColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400'

  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'} 
        ${bgColor} 
        ${borderColor} 
        ${textColor}
        transition-all duration-300 ease-in-out
        border-r
        flex flex-col
        h-screen
      `}
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-mono truncate">Taskflow-AI</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`${iconColor} hover:${textColor} transition-colors`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <RiMenuUnfoldLine size={20} /> : <RiMenuFoldLine size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg mb-1
                ${isCollapsed ? 'justify-center' : ''}
                transition-colors duration-200
                ${isActive 
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-gray-800 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:bg-white hover:text-gray-900'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon className={`text-xl ${isActive ? 'text-current' : iconColor}`} />
              {!isCollapsed && (
                <span className="font-medium truncate">{link.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}