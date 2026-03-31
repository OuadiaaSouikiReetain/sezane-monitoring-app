import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { AutomationsPage } from '@/features/automations/components/automations-page'

export const automationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/automations',
  component: AutomationsPage,
})
