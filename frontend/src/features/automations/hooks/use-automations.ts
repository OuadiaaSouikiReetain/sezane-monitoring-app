import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { automationsApi } from '../api/automations.api'

export function useAutomations(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.automations.list(params as Record<string, unknown>),
    queryFn: () => automationsApi.getAutomations(params),
    staleTime: STALE_TIMES.standard,
  })
}

export function useAutomation(id: number) {
  return useQuery({
    queryKey: queryKeys.automations.detail(id),
    queryFn: () => automationsApi.getAutomation(id),
    staleTime: STALE_TIMES.standard,
    enabled: !!id,
  })
}
