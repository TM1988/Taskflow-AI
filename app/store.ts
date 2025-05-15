import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  name: string
  setName: (name: string) => void
  email: string
  setEmail: (email: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      name: 'John Doe',
      setName: (name) => set({ name }),
      email: 'john@example.com',
      setEmail: (email) => set({ email }),
    }),
    {
      name: 'settings-storage',
    }
  )
)