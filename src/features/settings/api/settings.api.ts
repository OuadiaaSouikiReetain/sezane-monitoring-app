import { httpClient } from '@/shared/api/http-client'
import type { SettingsRule } from '@/entities/kpi/model'

export const settingsApi = {
  getRules: () =>
    httpClient.get<SettingsRule[]>('/settings/rules/').then((r) => r.data),
  updateRule: (id: number, data: Partial<SettingsRule>) =>
    httpClient.patch<SettingsRule>(`/settings/rules/${id}/`, data).then((r) => r.data),
}
