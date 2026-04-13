import type { Status } from '@/shared/types'

export interface Automation {
  id: number
  name: string
  frequency: string
  lastRun: string
  duration: string
  status: Status
  delay: boolean
}
