import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSettingsStore } from '@/app/store'

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
  const theme = useSettingsStore((state) => state.theme)

  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 ${theme === 'light' ? 'bg-white' : 'bg-gray-900'} border-r ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className={`text-xl font-mono ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
            Taskflow-AI
          </h1>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            v1.0
          </p>
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
                    ? theme === 'light'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-gray-800 text-white'
                    : theme === 'light'
                      ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}