import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  name: string
  setName: (name: string) => void
  email: string
  setEmail: (email: string) => void
  apiKeys: {
    openai?: string
    github?: string
  }
  setApiKey: (provider: 'openai' | 'github', key: string) => void
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
      apiKeys: {},
      setApiKey: (provider, key) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key }
      })),
    }),
    {
      name: 'settings-storage',
    }
  )
)