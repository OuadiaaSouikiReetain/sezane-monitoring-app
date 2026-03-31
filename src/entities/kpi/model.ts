export interface KpiData {
  journeys: { total: number; healthy: number; degraded: number; critical: number }
  automations: { total: number; healthy: number; degraded: number; critical: number }
  incidents: { open: number; resolved: number; mttr: string }
  apiLatency: { avg: number; p95: number; p99: number }
}

export interface AnalyticsKpi {
  label: string
  value: string
  trend: string
  up: boolean
}

export interface ApiHealth {
  name: string
  latency: number
  p95: number
  successRate: number
  status: 'healthy' | 'degraded' | 'critical'
  uptime: string
}

export interface ActivityPoint {
  time: string
  success: number
  failures: number
}

export interface PerformanceTrendPoint {
  week: string
  successRate: number
  deliveryRate: number
  sla: number
}

export interface SettingsRule {
  id: number
  name: string
  type: 'SLA' | 'Threshold' | 'Anomaly'
  value: string
  action: string
  active: boolean
}
