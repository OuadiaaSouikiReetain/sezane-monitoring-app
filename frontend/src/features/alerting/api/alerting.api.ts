import { alertingApi } from '@/shared/api/alerting-client'

export const alertingFeatureApi = {
  getAlerts: (params?: { status?: string; severity?: string }) =>
    alertingApi.getAlerts(params).then((r) => r.data.results),
  acknowledgeAlert: (id: number) =>
    alertingApi.acknowledgeAlert(id).then((r) => r.data),
  resolveAlert: (id: number) =>
    alertingApi.resolveAlert(id).then((r) => r.data),
}
