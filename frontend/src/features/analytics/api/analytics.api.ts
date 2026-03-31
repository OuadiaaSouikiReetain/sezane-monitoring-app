import { analyticsApi } from '@/shared/api/analytics-client'

export const analyticsFeatureApi = {
  getKpis: () => analyticsApi.getAnalyticsKpis().then((r) => r.data),
  getTrend: () => analyticsApi.getPerformanceTrend().then((r) => r.data),
}
