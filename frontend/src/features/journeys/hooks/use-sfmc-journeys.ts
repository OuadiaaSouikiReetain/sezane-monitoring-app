import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { sfmcJourneysApi } from '../api/sfmc-journeys.api'
import {
  SFMC_JOURNEY_STATUS_MAP,
  SFMC_JOURNEY_TYPE_LABEL,
  type SfmcJourneyEnriched,
  type SfmcJourneyFilters,
} from '../types/sfmc-journey.types'

function shouldRetry(failureCount: number, error: unknown): boolean {
  if ((error as Error)?.name === 'SfmcAuthError') return false
  return failureCount < 2
}

/**
 * Récupère toutes les journeys Journey Builder depuis SFMC.
 * Enrichit chaque journey avec un status interne et un label de type.
 */
export function useSfmcJourneys(filters?: SfmcJourneyFilters) {
  const query = useQuery({
    queryKey: queryKeys.sfmcJourneys.list(),
    queryFn:  sfmcJourneysApi.getAllJourneys,
    staleTime: STALE_TIMES.standard,
    retry:    shouldRetry,
  })

  const journeys = useMemo<SfmcJourneyEnriched[]>(() => {
    const data = query.data ?? []

    const enriched = data.map((j) => ({
      ...j,
      mappedStatus: SFMC_JOURNEY_STATUS_MAP[j.status] ?? 'unknown',
      typeLabel:    SFMC_JOURNEY_TYPE_LABEL[j.definitionType ?? ''] ?? j.definitionType ?? '—',
    }))

    if (!filters) return enriched

    return enriched.filter((j) => {
      if (filters.status && j.status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (
          j.name.toLowerCase().includes(q) ||
          (j.description?.toLowerCase().includes(q) ?? false) ||
          (j.key?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [query.data, filters])

  return { ...query, journeys }
}
