import { sfmcGet, sfmcGetAllPages } from '@/shared/api/sfmc-client'
import {
  SfmcAutomationSchema,
  type SfmcAutomation,
  type SfmcAutomationFilters,
} from '../types/automation.types'

export const sfmcAutomationsApi = {
  /**
   * Fetches ALL automations across all pages, with optional client-side filtering.
   * Pagination is handled automatically via sfmcGetAllPages.
   */
  getAllAutomations: async (
    filters?: SfmcAutomationFilters
  ): Promise<SfmcAutomation[]> => {
    const raw = await sfmcGetAllPages<unknown>('/automation/v1/automations')
    const parsed = raw.map((item) => SfmcAutomationSchema.parse(item))

    if (!filters) return parsed

    return parsed.filter((a) => {
      if (filters.statusId !== undefined && a.statusId !== filters.statusId) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          (a.description?.toLowerCase().includes(q) ?? false) ||
          (a.key?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  },

  /**
   * Fetches the full details (including steps & activities) for a single automation.
   * The SFMC detail endpoint returns steps embedded in the response, so no
   * separate /activities call is needed.
   */
  getAutomationDetails: async (id: string): Promise<SfmcAutomation> => {
    const raw = await sfmcGet<unknown>(`/automation/v1/automations/${id}`)
    return SfmcAutomationSchema.parse(raw)
  },
}
