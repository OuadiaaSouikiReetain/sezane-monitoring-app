import { useMemo } from 'react'
import { useSfmcAutomations } from '@/features/automations/hooks/use-sfmc-automations'
import { useSfmcJourneys } from '@/features/journeys/hooks/use-sfmc-journeys'

export interface SfmcOverviewKpis {
  journeys: {
    total:    number
    healthy:  number
    degraded: number
    critical: number
  }
  automations: {
    total:    number
    healthy:  number
    degraded: number
    critical: number
  }
  population: {
    current:    number   // contacts actuellement dans une journey
    cumulative: number   // total entrées historiques
  }
  isLoading: boolean
  isError:   boolean
}

/**
 * Agrège les données Journeys + Automations SFMC en KPIs globaux
 * pour l'Overview. Aucun appel supplémentaire — réutilise le cache
 * TanStack Query existant des deux features.
 */
export function useSfmcOverview(): SfmcOverviewKpis {
  const { journeys, isLoading: jLoading, isError: jError }       = useSfmcJourneys()
  const { automations, isLoading: aLoading, isError: aError }    = useSfmcAutomations()

  const kpis = useMemo<SfmcOverviewKpis>(() => ({
    journeys: {
      total:    journeys.length,
      healthy:  journeys.filter((j) => j.mappedStatus === 'healthy').length,
      degraded: journeys.filter((j) => j.mappedStatus === 'degraded').length,
      critical: journeys.filter((j) => j.mappedStatus === 'critical').length,
    },
    automations: {
      total:    automations.length,
      healthy:  automations.filter((a) => a.mappedStatus === 'healthy').length,
      degraded: automations.filter((a) => a.mappedStatus === 'degraded').length,
      critical: automations.filter((a) => a.mappedStatus === 'critical').length,
    },
    population: {
      current:    journeys.reduce((s, j) => s + (j.stats?.currentPopulation    ?? 0), 0),
      cumulative: journeys.reduce((s, j) => s + (j.stats?.cumulativePopulation ?? 0), 0),
    },
    isLoading: jLoading || aLoading,
    isError:   jError   || aError,
  }), [journeys, automations, jLoading, aLoading, jError, aError])

  return kpis
}
