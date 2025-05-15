'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  RiDashboardLine, 
  RiLayoutMasonryLine,
  RiPieChartLine,
  RiGitRepositoryLine,
  RiTeamLine,
  RiSettings3Line 
} from 'react-icons/ri'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/', icon: RiDashboardLine, label: 'Dashboard' },
    { href: '/board', icon: RiLayoutMasonryLine, label: 'Board' },
    { href: '/analytics', icon: RiPieChartLine, label: 'Analytics' },
    { href: '/repositories', icon: RiGitRepositoryLine, label: 'Repositories' },
    { href: '/team', icon: RiTeamLine, label: 'Team' },
    { href: '/settings', icon: RiSettings3Line, label: 'Settings' },
  ]

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
      <div className="mb-8">
        <h1 className="text-xl text-gray-200 font-mono">Taskflow-AI</h1>
        <p className="text-gray-500 text-sm">v1.0</p>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
            >
              <Icon className="text-lg" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}