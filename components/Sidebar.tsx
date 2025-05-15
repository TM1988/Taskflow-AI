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

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-900 border-gray-800'} border-r p-4 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed && (
          <h1 className={`text-xl ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>
            Taskflow-AI
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`${theme === 'light' ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400 hover:text-gray-200'} transition-colors`}
        >
          {isCollapsed ? <RiMenuUnfoldLine size={20} /> : <RiMenuFoldLine size={20} />}
        </button>
      </div>
      
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 ${isCollapsed ? 'justify-center' : ''} ${
                isActive 
                  ? theme === 'light'
                    ? 'bg-white text-gray-800'
                    : 'bg-gray-800 text-gray-200'
                  : theme === 'light'
                    ? 'text-gray-600 hover:bg-white hover:text-gray-800'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              } transition-colors`}
            >
              <Icon className="text-lg" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}