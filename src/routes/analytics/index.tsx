import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { AnalyticsPage } from '@/features/analytics/components/analytics-page'

export const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
})
