import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { settingsApi } from '../api/settings.api'

export function useSettingsRules() {
  return useQuery({
    queryKey: queryKeys.settings.rules(),
    queryFn: settingsApi.getRules,
    staleTime: STALE_TIMES.slow,
  })
}

export function useToggleRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      settingsApi.updateRule(id, { active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.rules() })
    },
  })
}
