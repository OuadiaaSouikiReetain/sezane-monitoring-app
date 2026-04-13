import type { Severity } from '@/shared/types'

export type AnomalyType = 'Automation Delay' | 'API Timeout' | 'Journey Drop' | 'KPI Anomaly'

export interface Anomaly {
  id: number
  type: AnomalyType
  description: string
  severity: Severity
  impact: string
  time: string
  journey: string | null
}
