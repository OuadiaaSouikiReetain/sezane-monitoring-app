import { alertingApi } from '@/shared/api/alerting-client'

export const anomaliesApi = {
  getAnomalies: (params?: { severity?: string }) =>
    alertingApi.getAnomalies(params).then((r) => r.data.results),
  getAnomaly: (id: number) =>
    alertingApi.getAnomaly(id).then((r) => r.data),
}
