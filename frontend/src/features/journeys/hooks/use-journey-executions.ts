/**
 * useJourneyExecutions
 * ────────────────────
 * Récupère l'historique des exécutions d'un journey depuis ExecutionLog DE.
 * Appel : GET /api/journeys/{id}/executions/?limit=15
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { ExecutionLogRow } from '@/features/automations/hooks/use-automation-executions'

interface ExecutionsResponse {
  items: ExecutionLogRow[]
  count: number
}

async function fetchExecutions(id: string, limit = 15): Promise<ExecutionsResponse> {
  const { data } = await axios.get<ExecutionsResponse>(
    `/api/journeys/${id}/executions/`,
    { params: { limit } },
  )
  return data
}

export function useJourneyExecutions(journeyId: string | undefined, limit = 15) {
  return useQuery({
    queryKey:  ['journey-executions', journeyId, limit],
    queryFn:   () => fetchExecutions(journeyId!, limit),
    enabled:   !!journeyId,
    staleTime: 60 * 1000,
    retry:     1,
  })
}
