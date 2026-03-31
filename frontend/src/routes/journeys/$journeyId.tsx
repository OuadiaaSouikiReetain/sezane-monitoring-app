import { createRoute } from '@tanstack/react-router'
import { journeysRoute } from './index'
import { JourneyDetailPage } from '@/features/journeys/components/journey-detail-page'

export const journeyDetailRoute = createRoute({
  getParentRoute: () => journeysRoute,
  path: '$journeyId',
  component: JourneyDetailPage,
})
