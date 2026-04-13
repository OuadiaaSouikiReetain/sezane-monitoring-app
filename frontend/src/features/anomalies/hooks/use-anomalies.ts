import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { anomaliesApi } from '../api/anomalies.api'

export function useAnomalies(params?: { severity?: string }) {
  return useQuery({
    queryKey: queryKeys.anomalies.list(params as Record<string, unknown>),
    queryFn: () => anomaliesApi.getAnomalies(params),
    staleTime: STALE_TIMES.frequent,
  })
}

export function useAnomaly(id: number) {
  return useQuery({
    queryKey: queryKeys.anomalies.detail(id),
    queryFn: () => anomaliesApi.getAnomaly(id),
    staleTime: STALE_TIMES.frequent,
    enabled: !!id,
  })
}
