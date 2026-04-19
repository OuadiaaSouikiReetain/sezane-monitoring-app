/**
 * useAutomationExecutions
 * ───────────────────────
 * Récupère l'historique des runs d'une automation depuis ExecutionLog DE.
 * Appel : GET /api/automations/{id}/executions/?limit=15
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface ExecutionLogRow {
  id_log:            string
  sfmc_instance_id?: string
  component_type:    string
  component_id:      string
  component_name?:   string
  activity_id?:      string
  activity_name?:    string
  activity_type?:    string
  status:            string
  triggered_by?:     string
  start_time?:       string
  end_time?:         string
  duration_seconds?: number
  error_code?:       string
  error_message?:    string
}

interface ExecutionsResponse {
  items: ExecutionLogRow[]
  count: number
}

async function fetchExecutions(id: string, limit = 15): Promise<ExecutionsResponse> {
  const { data } = await axios.get<ExecutionsResponse>(
    `/api/automations/${id}/executions/`,
    { params: { limit } },
  )
  return data
}

export function useAutomationExecutions(automationId: string | undefined, limit = 15) {
  return useQuery({
    queryKey:  ['automation-executions', automationId, limit],
    queryFn:   () => fetchExecutions(automationId!, limit),
    enabled:   !!automationId,
    staleTime: 60 * 1000,   // 1 min
    retry:     1,
  })
}
