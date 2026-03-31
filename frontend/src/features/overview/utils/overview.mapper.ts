import type { KpiData, ApiHealth } from '@/entities/kpi/model'
import type { HealthData } from '../types/overview.types'

export function mapKpiToHealthData(kpiData: KpiData): HealthData[] {
  const totalHealthy = kpiData.journeys.healthy + kpiData.automations.healthy
  const totalDegraded = kpiData.journeys.degraded + kpiData.automations.degraded
  const totalCritical = kpiData.journeys.critical + kpiData.automations.critical

  return [
    { name: 'Healthy',  value: totalHealthy,  color: '#22C55E' },
    { name: 'Degraded', value: totalDegraded, color: '#F59E0B' },
    { name: 'Critical', value: totalCritical, color: '#EF4444' },
  ]
}

export function getApiStatusSummary(apis: ApiHealth[]) {
  return {
    healthy:  apis.filter((a) => a.status === 'healthy').length,
    degraded: apis.filter((a) => a.status === 'degraded').length,
    critical: apis.filter((a) => a.status === 'critical').length,
    total:    apis.length,
  }
}
