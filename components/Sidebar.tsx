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

const navigation = [
  { name: 'Dashboard', href: '/', icon: RiDashboardLine },
  { name: 'Board', href: '/board', icon: RiLayoutMasonryLine },
  { name: 'Analytics', href: '/analytics', icon: RiPieChartLine },
  { name: 'Repositories', href: '/repositories', icon: RiGitRepositoryLine },
  { name: 'Team', href: '/team', icon: RiTeamLine },
  { name: 'Settings', href: '/settings', icon: RiSettings3Line },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-xl font-mono text-gray-900 dark:text-gray-100">
            Taskflow-AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            v1.0
          </p>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors gap-3
                  ${isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="flex-shrink-0" size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}