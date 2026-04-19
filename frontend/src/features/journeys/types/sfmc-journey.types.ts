import { z } from 'zod'
import type { Status } from '@/shared/types'

// ─── SFMC Journey status mapping ──────────────────────────────────────────────
// Ref: https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/interaction-rest.html

export const SFMC_JOURNEY_STATUS_MAP: Record<string, Status> = {
  Published:       'healthy',
  Sending:         'healthy',
  ScheduledToSend: 'healthy',
  Draft:           'degraded',
  Stopped:         'degraded',
  Deleted:         'unknown',
  Unpublished:     'degraded',
}

export const SFMC_JOURNEY_TYPE_LABEL: Record<string, string> = {
  Multistep:     'Multi-Step',
  Transactional: 'Transactional',
  QuickSend:     'Quick Send',
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const SfmcJourneyStatsSchema = z.object({
  currentPopulation:    z.number().optional(),
  cumulativePopulation: z.number().optional(),
  metGoal:              z.number().optional(),
  metExitCriteria:      z.number().optional(),
  exited:               z.number().optional(),
  sent:                 z.number().optional(),
})

const SfmcActivitySchema = z.object({
  id:   z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
}).passthrough()

export const SfmcJourneySchema = z.object({
  id:                z.string(),
  name:              z.string(),
  key:               z.string().nullable().optional(),
  status:            z.string(),
  definitionType:    z.string().nullable().optional(),
  version:           z.number().nullable().optional(),
  description:       z.string().nullable().optional(),
  lastPublishedDate: z.string().nullable().optional(),
  createdDate:       z.string().nullable().optional(),
  modifiedDate:      z.string().nullable().optional(),
  stats:             SfmcJourneyStatsSchema.nullable().optional(),
  activities:        z.array(SfmcActivitySchema).optional().default([]),
}).passthrough()

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type SfmcJourney         = z.infer<typeof SfmcJourneySchema>
export type SfmcJourneyStats    = z.infer<typeof SfmcJourneyStatsSchema>

export interface SfmcJourneyEnriched extends SfmcJourney {
  mappedStatus: Status
  typeLabel:    string
}

export interface SfmcJourneyFilters {
  status?: string
  search?: string
}
