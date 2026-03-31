import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { SettingsPage } from '@/features/settings/components/settings-page'

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})
