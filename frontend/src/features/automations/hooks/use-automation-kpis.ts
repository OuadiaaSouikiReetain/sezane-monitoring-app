/**
 * useAutomationKpis
 * ─────────────────
 * Récupère les KPIs d'une automation depuis le backend Django.
 * Appel : GET /api/automations/{id}/kpis/?days=30
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { EmailKpiData } from '@/shared/components/email-kpi-section'

// ── Groupe 1 : Fiabilité ──────────────────────────────────────────────────────
export interface ReliabilityKpis {
  success_rate:                  number
  error_rate:                    number
  error_count:                   number
  consecutive_failures:          number
  time_since_last_success_hours: number | null
  time_since_last_run_hours:     number | null
  total_runs:                    number
  success_count:                 number
}

// ── Groupe 2 : Performance ────────────────────────────────────────────────────
export interface PerformanceKpis {
  avg_duration_seconds: number | null
  max_duration_seconds: number | null
  min_duration_seconds: number | null
  p95_duration_seconds: number | null
}

// ── Groupe 3 : Santé par activité ─────────────────────────────────────────────
export interface ActivityBreakdownItem {
  name:                 string
  type:                 string
  step_id:              string | null
  total_runs:           number
  error_count:          number
  error_rate:           number
  avg_duration_seconds: number | null
  last_error:           string | null
}

export interface ActivityKpis {
  breakdown:  ActivityBreakdownItem[]
  top_errors: { message: string; count: number }[]
}

// ── Groupe 4 : Composite ──────────────────────────────────────────────────────
export interface CompositeKpis {
  health_score: number
  mtbf_hours:   number | null
  mttr_hours:   number | null
}

// ── Réponse complète ──────────────────────────────────────────────────────────
export interface HistoricalKpis {
  reliability?: ReliabilityKpis
  performance?: PerformanceKpis
  activity?:    ActivityKpis
  composite?:   CompositeKpis
}

export interface AutomationKpisResponse {
  component_id:    string
  name:            string
  status:          string
  live_kpis:       Record<string, unknown>
  historical_kpis: HistoricalKpis
  email_kpis:      EmailKpiData
  has_history:     boolean
  computed_at:     string | null
}

async function fetchAutomationKpis(id: string, days = 30): Promise<AutomationKpisResponse> {
  const { data } = await axios.get<AutomationKpisResponse>(
    `/api/automations/${id}/kpis/`,
    { params: { days } },
  )
  return data
}

export function useAutomationKpis(automationId: string | undefined, days = 30) {
  return useQuery({
    queryKey:  ['automation-kpis', automationId, days],
    queryFn:   () => fetchAutomationKpis(automationId!, days),
    enabled:   !!automationId,
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })
}
