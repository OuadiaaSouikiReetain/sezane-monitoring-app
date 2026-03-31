import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../__root'
import { AnomaliesPage } from '@/features/anomalies/components/anomalies-page'

export const anomaliesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/anomalies',
  component: AnomaliesPage,
})
