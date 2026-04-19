import { redirect } from '@tanstack/react-router'
import { useSessionStore } from '@/app/store/session-store'

export function requireAuth() {
  // Auth désactivée en dev
  return
  const { isAuthenticated } = useSessionStore.getState()
  if (!isAuthenticated) {
    throw redirect({ to: '/' })
  }
}
