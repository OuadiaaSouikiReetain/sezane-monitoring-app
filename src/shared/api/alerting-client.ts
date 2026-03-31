import { httpClient } from './http-client'
import type { Alert } from '@/entities/alert/model'
import type { Anomaly } from '@/entities/anomaly/model'
import type { PaginatedResponse } from '@/shared/types'

export const alertingApi = {
  getAlerts: (params?: { status?: string; severity?: string }) =>
    httpClient.get<PaginatedResponse<Alert>>('/alerts/', { params }),
  getAlert: (id: number) =>
    httpClient.get<Alert>(`/alerts/${id}/`),
  getAnomalies: (params?: { severity?: string }) =>
    httpClient.get<PaginatedResponse<Anomaly>>('/anomalies/', { params }),
  getAnomaly: (id: number) =>
    httpClient.get<Anomaly>(`/anomalies/${id}/`),
  acknowledgeAlert: (id: number) =>
    httpClient.post<Alert>(`/alerts/${id}/acknowledge/`),
  resolveAlert: (id: number) =>
    httpClient.post<Alert>(`/alerts/${id}/resolve/`),
}
