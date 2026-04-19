/**
 * useJourneyKpis
 * ──────────────
 * Récupère les KPIs email d'un journey depuis le backend Django.
 * Appel : GET /api/journeys/{id}/kpis/?days=30
 *
 * Le backend calcule les KPIs depuis SFMC tracking API et les DEs.
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { EmailKpiData } from '@/shared/components/email-kpi-section'

interface JourneyKpisResponse {
  component_id: string
  name:         string
  status:       string
  live_kpis:    Record<string, unknown>
  email_kpis:   EmailKpiData
  kpi_values:   unknown[]
  has_history:  boolean
}

async function fetchJourneyKpis(id: string, days = 30): Promise<JourneyKpisResponse> {
  const { data } = await axios.get<JourneyKpisResponse>(
    `/api/journeys/${id}/kpis/`,
    { params: { days } },
  )
  return data
}

export function useJourneyKpis(journeyId: string | undefined, days = 30) {
  return useQuery({
    queryKey:  ['journey-kpis', journeyId, days],
    queryFn:   () => fetchJourneyKpis(journeyId!, days),
    enabled:   !!journeyId,
    staleTime: 5 * 60 * 1000,   // 5 min — les KPIs ne changent pas à la seconde
    retry:     1,
  })
}
