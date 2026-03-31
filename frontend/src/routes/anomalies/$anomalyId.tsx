import { createRoute } from '@tanstack/react-router'
import { anomaliesRoute } from './index'
import { AnomalyDetailPage } from '@/features/anomalies/components/anomaly-detail-page'

export const anomalyDetailRoute = createRoute({
  getParentRoute: () => anomaliesRoute,
  path: '$anomalyId',
  component: AnomalyDetailPage,
})
