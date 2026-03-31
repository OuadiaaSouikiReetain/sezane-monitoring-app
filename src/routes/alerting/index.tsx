import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { AlertingPage } from '@/features/alerting/components/alerting-page'

export const alertingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/alerting',
  component: AlertingPage,
})
