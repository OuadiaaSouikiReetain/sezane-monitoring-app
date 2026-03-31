import type { Severity, AlertStatus } from '@/shared/types'

export type AlertChannel = 'Slack + Email' | 'Email + SMS' | 'PagerDuty' | 'Slack' | 'Email'

export interface Alert {
  id: number
  title: string
  severity: Severity
  recipient: string
  channel: AlertChannel
  escalated: boolean
  time: string
  status: AlertStatus
}
