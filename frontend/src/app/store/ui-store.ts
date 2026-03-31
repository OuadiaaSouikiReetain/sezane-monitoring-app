import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  notificationCount: number
  theme: 'dark' | 'light'
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setNotificationCount: (n: number) => void
  setTheme: (t: 'dark' | 'light') => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      notificationCount: 3,
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setNotificationCount: (n) => set({ notificationCount: n }),
      setTheme: (t) => set({ theme: t }),
    }),
    { name: 'sfmc-ui' }
  )
)
