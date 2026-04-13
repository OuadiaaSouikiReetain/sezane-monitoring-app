import { collectorApi } from '@/shared/api/collector-client'

export const automationsApi = {
  getAutomations: (params?: { status?: string }) =>
    collectorApi.getAutomations(params).then((r) => r.data),
  getAutomation: (id: number) =>
    collectorApi.getAutomation(id).then((r) => r.data),
}
