import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { JourneysPage } from '@/features/journeys/components/journeys-page'

export const journeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journeys',
  component: JourneysPage,
})
