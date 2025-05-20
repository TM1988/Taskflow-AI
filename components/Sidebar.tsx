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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">TF</span>
            </span>
            Taskflow-AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}