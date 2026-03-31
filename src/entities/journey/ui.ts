import type { Status } from '@/shared/types'

export function getSlaColor(sla: number): string {
  if (sla >= 95) return 'text-success'
  if (sla >= 85) return 'text-warning'
  return 'text-danger'
}

export function getStatusBorderClass(status: Status): string {
  switch (status) {
    case 'critical': return 'border-l-danger'
    case 'degraded': return 'border-l-warning'
    case 'healthy':  return 'border-l-success'
    default:         return ''
  }
}

export function getSlaBarColor(sla: number): string {
  if (sla >= 95) return 'bg-success'
  if (sla >= 85) return 'bg-warning'
  return 'bg-danger'
}
