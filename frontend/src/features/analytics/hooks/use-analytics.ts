import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { analyticsFeatureApi } from '../api/analytics.api'

export function useAnalyticsKpis() {
  return useQuery({
    queryKey: queryKeys.analytics.kpis(),
    queryFn: analyticsFeatureApi.getKpis,
    staleTime: STALE_TIMES.standard,
  })
}

export function usePerformanceTrend() {
  return useQuery({
    queryKey: queryKeys.analytics.trend(),
    queryFn: analyticsFeatureApi.getTrend,
    staleTime: STALE_TIMES.standard,
  })
}
