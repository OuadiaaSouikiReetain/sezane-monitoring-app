import { collectorApi } from '@/shared/api/collector-client'
import type { JourneyFilters } from '../types/journey.types'

export const journeysApi = {
  getJourneys: (filters?: Partial<JourneyFilters>) =>
    collectorApi.getJourneys({
      bu:     filters?.bu !== 'All' ? filters?.bu : undefined,
      status: filters?.status !== 'All' ? filters?.status : undefined,
    }).then((r) => r.data),

  getJourney: (id: number) =>
    collectorApi.getJourney(id).then((r) => r.data),
}
