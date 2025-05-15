import { useSettingsStore } from '@/app/store'
import Sidebar from './Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme)
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <Sidebar />
        <main className="pl-64">
          {children}
        </main>
      </div>
    </div>
  )
}