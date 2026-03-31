import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { STALE_TIMES } from '@/shared/constants'
import { journeysApi } from '../api/journeys.api'
import type { JourneyFilters } from '../types/journey.types'

export function useJourneys(filters?: Partial<JourneyFilters>) {
  return useQuery({
    queryKey: queryKeys.journeys.list(filters as Record<string, unknown>),
    queryFn: () => journeysApi.getJourneys(filters),
    staleTime: STALE_TIMES.standard,
  })
}

export function useJourney(id: number) {
  return useQuery({
    queryKey: queryKeys.journeys.detail(id),
    queryFn: () => journeysApi.getJourney(id),
    staleTime: STALE_TIMES.standard,
    enabled: !!id,
  })
}
