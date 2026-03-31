import { httpClient } from './http-client'
import type { Journey } from '@/entities/journey/model'
import type { Automation } from '@/entities/automation/model'
import type { KpiData, ActivityPoint } from '@/entities/kpi/model'
import type { ApiHealth } from '@/entities/kpi/model'
import type { PaginatedResponse } from '@/shared/types'

export const collectorApi = {
  // Journeys
  getJourneys: (params?: { bu?: string; status?: string }) =>
    httpClient.get<PaginatedResponse<Journey>>('/journeys/', { params }),
  getJourney: (id: number) =>
    httpClient.get<Journey>(`/journeys/${id}/`),

  // Automations
  getAutomations: (params?: { status?: string }) =>
    httpClient.get<PaginatedResponse<Automation>>('/automations/', { params }),
  getAutomation: (id: number) =>
    httpClient.get<Automation>(`/automations/${id}/`),

  // Overview KPIs
  getKpis: () =>
    httpClient.get<KpiData>('/overview/kpis/'),
  getActivityChart: () =>
    httpClient.get<ActivityPoint[]>('/overview/activity/'),

  // API health
  getApiHealth: () =>
    httpClient.get<ApiHealth[]>('/api-health/'),
}
