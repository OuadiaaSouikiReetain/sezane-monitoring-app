import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { ApiHealthPage } from '@/features/api-health/components/api-health-page'

export const apiHealthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-health',
  component: ApiHealthPage,
})
