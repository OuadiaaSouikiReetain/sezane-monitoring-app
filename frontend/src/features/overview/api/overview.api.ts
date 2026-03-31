import { collectorApi } from '@/shared/api/collector-client'
import { alertingApi } from '@/shared/api/alerting-client'

export const overviewApi = {
  getKpis: () => collectorApi.getKpis().then((r) => r.data),
  getActivityChart: () => collectorApi.getActivityChart().then((r) => r.data),
  getAnomalies: () => alertingApi.getAnomalies().then((r) => r.data.results),
  getApiHealth: () => collectorApi.getApiHealth().then((r) => r.data),
}
