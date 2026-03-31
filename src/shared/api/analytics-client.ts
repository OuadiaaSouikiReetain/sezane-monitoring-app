import { httpClient } from './http-client'
import type { AnalyticsKpi, PerformanceTrendPoint } from '@/entities/kpi/model'

interface BusinessUnitMetric {
  bu: string
  successRate: number
  sla: number
  delivery: number
}

export const analyticsApi = {
  getAnalyticsKpis: () =>
    httpClient.get<AnalyticsKpi[]>('/analytics/kpis/'),
  getPerformanceTrend: () =>
    httpClient.get<PerformanceTrendPoint[]>('/analytics/trend/'),
  getBusinessUnitMetrics: () =>
    httpClient.get<BusinessUnitMetric[]>('/analytics/business-units/'),
}
