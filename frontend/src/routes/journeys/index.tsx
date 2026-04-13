import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { SfmcJourneysPanel } from '@/features/journeys/components/sfmc-journeys-panel'

export const journeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journeys',
  component: SfmcJourneysPanel,
})
