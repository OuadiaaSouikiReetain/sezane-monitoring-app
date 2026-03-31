import { rootRoute } from '@/routes/__root'
import { indexRoute } from '@/routes/index'
import { journeysRoute } from '@/routes/journeys/index'
import { journeyDetailRoute } from '@/routes/journeys/$journeyId'
import { automationsRoute } from '@/routes/automations/index'
import { automationDetailRoute } from '@/routes/automations/$automationId'
import { apiHealthRoute } from '@/routes/api-health/index'
import { anomaliesRoute } from '@/routes/anomalies/index'
import { anomalyDetailRoute } from '@/routes/anomalies/$anomalyId'
import { alertingRoute } from '@/routes/alerting/index'
import { analyticsRoute } from '@/routes/analytics/index'
import { settingsRoute } from '@/routes/settings/index'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  journeysRoute.addChildren([journeyDetailRoute]),
  automationsRoute.addChildren([automationDetailRoute]),
  apiHealthRoute,
  anomaliesRoute.addChildren([anomalyDetailRoute]),
  alertingRoute,
  analyticsRoute,
  settingsRoute,
])
