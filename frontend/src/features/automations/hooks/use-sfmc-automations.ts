import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { sfmcAutomationsApi } from '../api/sfmc-automations.api'
import {
  SFMC_STATUS_MAP,
  SFMC_STATUS_LABEL,
  type SfmcAutomationEnriched,
  type SfmcAutomationFilters,
} from '../types/automation.types'

// Auth config errors should not be retried — they require a .env fix.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if ((error as Error)?.name === 'SfmcAuthError') return false
  return failureCount < 2
}

/**
 * Fetches all SFMC automations (all pages) and enriches each record with:
 *   - mappedStatus: internal Status type derived from SFMC statusId
 *   - statusLabel:  human-readable status string
 *   - activityCount: total number of activities across all steps
 *
 * Client-side filters (statusId, search) are applied after fetching.
 */
export function useSfmcAutomations(filters?: SfmcAutomationFilters) {
  const query = useQuery({
    queryKey: queryKeys.sfmcAutomations.list(),
    queryFn:  () => sfmcAutomationsApi.getAllAutomations(),
    staleTime: STALE_TIMES.standard,
    retry:    shouldRetry,
  })

  const automations = useMemo<SfmcAutomationEnriched[]>(() => {
    const data = query.data ?? []

    const enriched = data.map((a) => ({
      ...a,
      mappedStatus:  SFMC_STATUS_MAP[a.statusId]    ?? 'unknown',
      statusLabel:   SFMC_STATUS_LABEL[a.statusId]  ?? 'Unknown',
      activityCount: a.steps.reduce((sum, s) => sum + s.activities.length, 0),
    }))

    if (!filters) return enriched

    return enriched.filter((a) => {
      if (filters.statusId !== undefined && a.statusId !== filters.statusId) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          (a.description?.toLowerCase().includes(q) ?? false) ||
          (a.key?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [query.data, filters])

  return { ...query, automations }
}

/**
 * Fetches full details (steps + activities) for a single SFMC automation by ID.
 */
export function useSfmcAutomationDetails(id: string) {
  const query = useQuery({
    queryKey: queryKeys.sfmcAutomations.detail(id),
    queryFn:  () => sfmcAutomationsApi.getAutomationDetails(id),
    staleTime: STALE_TIMES.standard,
    enabled:  !!id,
    retry:    shouldRetry,
  })

  const automation = useMemo<SfmcAutomationEnriched | undefined>(() => {
    if (!query.data) return undefined
    const a = query.data
    return {
      ...a,
      mappedStatus:  SFMC_STATUS_MAP[a.statusId]   ?? 'unknown',
      statusLabel:   SFMC_STATUS_LABEL[a.statusId] ?? 'Unknown',
      activityCount: a.steps.reduce((sum, s) => sum + s.activities.length, 0),
    }
  }, [query.data])

  return { ...query, automation }
}
