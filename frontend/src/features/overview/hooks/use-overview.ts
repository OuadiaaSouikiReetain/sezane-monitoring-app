import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { overviewApi } from '../api/overview.api'

export function useOverviewKpis() {
  return useQuery({
    queryKey: queryKeys.overview.kpis(),
    queryFn: overviewApi.getKpis,
    staleTime: STALE_TIMES.frequent,
  })
}

export function useActivityChart() {
  return useQuery({
    queryKey: queryKeys.overview.activity(),
    queryFn: overviewApi.getActivityChart,
    staleTime: STALE_TIMES.frequent,
  })
}

export function useOverviewAnomalies() {
  return useQuery({
    queryKey: queryKeys.anomalies.list(),
    queryFn: overviewApi.getAnomalies,
    staleTime: STALE_TIMES.frequent,
  })
}

export function useOverviewApis() {
  return useQuery({
    queryKey: queryKeys.apiHealth.list(),
    queryFn: overviewApi.getApiHealth,
    staleTime: STALE_TIMES.frequent,
  })
}
