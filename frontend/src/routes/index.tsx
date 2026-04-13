import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './__root'
import { OverviewPage } from '@/features/overview/components/overview-page'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewPage,
})
