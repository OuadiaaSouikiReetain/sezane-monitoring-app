import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { SfmcAutomationsPanel } from '@/features/automations/components/sfmc-automations-panel'

export const automationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/automations',
  component: SfmcAutomationsPanel,
})
