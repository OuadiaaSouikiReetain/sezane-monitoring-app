import { http, HttpResponse } from 'msw'
import {
  kpiData,
  journeys,
  automations,
  apis,
  anomalies,
  alerts,
  activityChartData,
  analyticsKpis,
  performanceTrend,
  settingsRules,
} from './data'

export const handlers = [
  http.get('*/api/overview/kpis/', () => HttpResponse.json(kpiData)),
  http.get('*/api/overview/activity/', () => HttpResponse.json(activityChartData)),

  http.get('*/api/journeys/', () =>
    HttpResponse.json({ results: journeys, count: journeys.length, next: null, previous: null })
  ),
  http.get('*/api/journeys/:id/', ({ params }) => {
    const j = journeys.find((j) => j.id === Number(params.id))
    return j ? HttpResponse.json(j) : new HttpResponse(null, { status: 404 })
  }),

  http.get('*/api/automations/', () =>
    HttpResponse.json({ results: automations, count: automations.length, next: null, previous: null })
  ),
  http.get('*/api/automations/:id/', ({ params }) => {
    const a = automations.find((a) => a.id === Number(params.id))
    return a ? HttpResponse.json(a) : new HttpResponse(null, { status: 404 })
  }),

  http.get('*/api/api-health/', () => HttpResponse.json(apis)),

  http.get('*/api/anomalies/', () =>
    HttpResponse.json({ results: anomalies, count: anomalies.length, next: null, previous: null })
  ),
  http.get('*/api/anomalies/:id/', ({ params }) => {
    const a = anomalies.find((a) => a.id === Number(params.id))
    return a ? HttpResponse.json(a) : new HttpResponse(null, { status: 404 })
  }),

  http.get('*/api/alerts/', () =>
    HttpResponse.json({ results: alerts, count: alerts.length, next: null, previous: null })
  ),

  http.get('*/api/analytics/kpis/', () => HttpResponse.json(analyticsKpis)),
  http.get('*/api/analytics/trend/', () => HttpResponse.json(performanceTrend)),

  http.get('*/api/settings/rules/', () => HttpResponse.json(settingsRules)),

  http.post('*/api/auth/token/', () =>
    HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token' })
  ),
  http.get('*/api/auth/me/', () =>
    HttpResponse.json({ id: 1, username: 'admin', email: 'admin@sfmc.io', firstName: 'Admin', lastName: 'Ops' })
  ),
]
