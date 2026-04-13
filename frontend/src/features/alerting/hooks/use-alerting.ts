import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { alertingFeatureApi } from '../api/alerting.api'

export function useAlerts(params?: { status?: string; severity?: string }) {
  return useQuery({
    queryKey: queryKeys.alerts.list(params as Record<string, unknown>),
    queryFn: () => alertingFeatureApi.getAlerts(params),
    staleTime: STALE_TIMES.frequent,
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alertingFeatureApi.acknowledgeAlert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all() })
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alertingFeatureApi.resolveAlert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all() })
    },
  })
}
