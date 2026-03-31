import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { apiHealthApi } from '../api/api-health.api'

export function useApiHealth() {
  return useQuery({
    queryKey: queryKeys.apiHealth.list(),
    queryFn: apiHealthApi.getApiHealth,
    staleTime: STALE_TIMES.frequent,
  })
}
