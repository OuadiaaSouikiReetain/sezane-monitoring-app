import { useEffect, type ReactNode } from 'react'
import { authApi } from '@/shared/api/auth-client'
import { useSessionStore } from '@/app/store/session-store'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, setUser, logout } = useSessionStore()

  useEffect(() => {
    if (!isAuthenticated) return
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => logout())
  }, [isAuthenticated, setUser, logout])

  return <>{children}</>
}
