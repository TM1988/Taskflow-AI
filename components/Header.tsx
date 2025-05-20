'use client'

import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { RiSettings4Line, RiLogoutBoxLine } from 'react-icons/ri'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, logOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  const goToSettings = () => {
    router.push('/settings')
  }

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={goToSettings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Settings"
          >
            <RiSettings4Line className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Logout"
          >
            <RiLogoutBoxLine className="w-5 h-5" />
          </button>
        </div>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </header>
  )
}