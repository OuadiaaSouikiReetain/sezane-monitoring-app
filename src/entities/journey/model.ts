import type { Status } from '@/shared/types'

export interface Journey {
  id: number
  name: string
  bu: string
  owner: string
  status: Status
  entries: number
  sla: number
  anomalies: number
}
