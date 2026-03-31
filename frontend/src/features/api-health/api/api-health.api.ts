import { collectorApi } from '@/shared/api/collector-client'

export const apiHealthApi = {
  getApiHealth: () => collectorApi.getApiHealth().then((r) => r.data),
}
