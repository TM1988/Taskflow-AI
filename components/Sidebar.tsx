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

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const links = [
    { href: '/', icon: RiDashboardLine, label: 'Dashboard' },
    { href: '/board', icon: RiLayoutMasonryLine, label: 'Board' },
    { href: '/analytics', icon: RiPieChartLine, label: 'Analytics' },
    { href: '/repositories', icon: RiGitRepositoryLine, label: 'Repositories' },
    { href: '/team', icon: RiTeamLine, label: 'Team' },
    { href: '/settings', icon: RiSettings3Line, label: 'Settings' },
  ]

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900 border-r border-gray-800 p-4 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed && <h1 className="text-xl text-gray-200">Taskflow-AI</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          {isCollapsed ? <RiMenuUnfoldLine size={20} /> : <RiMenuFoldLine size={20} />}
        </button>
      </div>
      
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
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