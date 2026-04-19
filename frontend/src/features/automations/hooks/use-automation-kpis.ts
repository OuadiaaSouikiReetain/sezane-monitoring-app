/**
 * useAutomationKpis
 * ─────────────────
 * Récupère les KPIs email d'une automation depuis le backend Django.
 * Appel : GET /api/automations/{id}/kpis/?days=30
 *
 * Le backend interroge SFMC SOAP (Send objects liés au Program.ID).
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { EmailKpiData } from '@/shared/components/email-kpi-section'

interface AutomationKpisResponse {
  component_id:    string
  name:            string
  status:          string
  live_kpis:       Record<string, unknown>
  historical_kpis: Record<string, unknown>
  email_kpis:      EmailKpiData
  has_history:     boolean
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
