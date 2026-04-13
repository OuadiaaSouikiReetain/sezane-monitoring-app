import { sfmcGet } from '@/shared/api/sfmc-client'
import { SfmcJourneySchema, type SfmcJourney } from '../types/sfmc-journey.types'

interface SfmcJourneyListResponse {
  items:    unknown[]
  count:    number
  page:     number
  pageSize: number
}

export const sfmcJourneysApi = {
  /**
   * Récupère toutes les journeys via l'API Journey Builder SFMC.
   * Gère la pagination manuellement ($page / $pageSize).
   * `extras=all` inclut les stats (population, entrées, sorties…).
   */
  getAllJourneys: async (): Promise<SfmcJourney[]> => {
    const all: SfmcJourney[] = []
    let page = 1
    const pageSize = 50

    do {
      const data = await sfmcGet<SfmcJourneyListResponse>(
        '/interaction/v1/interactions',
        { $page: page, $pageSize: pageSize, extras: 'all' }
      )

      const parsed = data.items.map((item) => SfmcJourneySchema.parse(item))
      all.push(...parsed)

      if (all.length >= data.count) break
      page++
    } while (true) // eslint-disable-line no-constant-condition

    return all
  },

  /**
   * Récupère le détail complet d'une journey par son ID.
   */
  getJourneyDetails: async (id: string): Promise<SfmcJourney> => {
    const data = await sfmcGet<unknown>(
      `/interaction/v1/interactions/${id}`,
      { extras: 'all' }
    )
    return SfmcJourneySchema.parse(data)
  },
}
