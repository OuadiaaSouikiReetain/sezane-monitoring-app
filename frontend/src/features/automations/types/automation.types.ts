import { z } from 'zod'
import type { Status } from '@/shared/types'

// ─── SFMC status mapping ──────────────────────────────────────────────────────
// Ref: https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/automation-rest.html

export const SFMC_STATUS_MAP: Record<number, Status> = {
  [-1]: 'critical',  // Error
  0:    'critical',  // BuildingError
  1:    'degraded',  // Building
  2:    'degraded',  // Ready (inactive / not scheduled)
  3:    'healthy',   // Running
  4:    'degraded',  // Paused
  5:    'unknown',   // Stopped
  6:    'healthy',   // Scheduled
  7:    'degraded',  // AwaitingClientPublish
  8:    'degraded',  // InactiveTrigger
}

export const SFMC_STATUS_LABEL: Record<number, string> = {
  [-1]: 'Error',
  0:    'Building Error',
  1:    'Building',
  2:    'Ready',
  3:    'Running',
  4:    'Paused',
  5:    'Stopped',
  6:    'Scheduled',
  7:    'Awaiting Publish',
  8:    'Inactive Trigger',
}

// Numeric activityTypeId → label lisible
// Sources : SFMC REST API docs + reverse engineering terrain
export const SFMC_ACTIVITY_TYPE: Record<number, string> = {
  1:  'Email Send',
  2:  'Email Send',
  4:  'Email Send',
  5:  'File Transfer',
  6:  'Script',
  12: 'Import',
  16: 'SQL Query',
  17: 'Data Extract',
  42: 'Email Send',
  43: 'SMS',
  44: 'Wait',
  45: 'Decision Split',
  46: 'Group By',
  51: 'SQL Query',
  53: 'File Transfer',
  55: 'Data Extract',
  57: 'Script',
  58: 'Verification',
  63: 'Report',
  73: 'Push Notification',
}

// String activityType → label (quand SFMC renvoie un string au lieu d'un ID)
export const SFMC_ACTIVITY_TYPE_STR: Record<string, string> = {
  QUERY:            'SQL Query',
  SCRIPT:           'Script',
  EMAILSEND:        'Email Send',
  FILEIMPORT:       'File Import',
  FILETRANSFER:     'File Transfer',
  DATAEXTRACT:      'Data Extract',
  VERIFICATION:     'Verification',
  REPORT:           'Report',
  PUSH:             'Push Notification',
  SMS:              'SMS',
  WAIT:             'Wait',
  SPLITACTIVITY:    'Decision Split',
  GROUPBYACTIVITY:  'Group By',
}

/** Résout le label d'une activité depuis tous les champs disponibles */
export function resolveActivityLabel(
  typeId:     number,
  typeStr?:   string | null,
  typeName?:  string | null,
): string {
  // 1. Nom explicite dans la réponse API (le plus fiable)
  if (typeName) return typeName
  // 2. String type (ex: "QUERY")
  if (typeStr) return SFMC_ACTIVITY_TYPE_STR[typeStr.toUpperCase()] ?? typeStr
  // 3. Numeric ID
  if (typeId && SFMC_ACTIVITY_TYPE[typeId]) return SFMC_ACTIVITY_TYPE[typeId]
  // 4. Fallback
  return typeId ? `Type ${typeId}` : 'Unknown'
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

// z.coerce.* tolère que SFMC renvoie un number en string ou vice-versa.
// .passthrough() ignore les champs inconnus sans planter le parse.
// .nullable().optional() accepte null ET undefined.

export const SfmcActivitySchema = z.object({
  id:               z.coerce.string(),
  name:             z.string().catch('—'),
  description:      z.string().nullable().optional(),
  activityObjectId: z.string().nullable().optional(),
  activityTypeId:   z.coerce.number().catch(0),
  // SFMC renvoie parfois le type en string (ex: "QUERY", "SCRIPT")
  activityType:     z.string().nullable().optional(),
  // Nom du type tel qu'il apparaît dans l'UI SFMC
  activityTypeName: z.string().nullable().optional(),
  displayOrder:     z.coerce.number().optional(),
  isActive:         z.boolean().nullable().optional(),
}).passthrough()

export const SfmcStepSchema = z.object({
  id:          z.coerce.string(),
  name:        z.string().catch('—'),
  description: z.string().nullable().optional(),
  stepNumber:  z.coerce.number().catch(0),
  activities:  z.array(SfmcActivitySchema).default([]),
}).passthrough()

export const SfmcScheduleSchema = z.object({
  id:            z.string().nullable().optional(),
  startDate:     z.string().nullable().optional(),
  endDate:       z.string().nullable().optional(),
  icalRecur:     z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  pattern:       z.string().nullable().optional(),
}).passthrough()

export const SfmcStartSourceSchema = z.object({
  schedule: SfmcScheduleSchema.optional(),
  typeId:   z.coerce.number().optional(),
}).passthrough()

export const SfmcAutomationSchema = z.object({
  id:           z.coerce.string(),
  name:         z.string().catch('—'),
  description:  z.string().nullable().optional(),
  key:          z.string().nullable().optional(),
  typeId:       z.coerce.number().optional(),
  type:         z.string().nullable().optional(),
  statusId:     z.coerce.number().catch(0),
  status:       z.string().nullable().optional(),
  startSource:  SfmcStartSourceSchema.nullable().optional(),
  steps:        z.array(SfmcStepSchema).default([]),
  createdDate:  z.string().nullable().optional(),
  modifiedDate: z.string().nullable().optional(),
  lastRunTime:  z.string().nullable().optional(),
}).passthrough()

// ─── Inferred TypeScript types ────────────────────────────────────────────────

export type SfmcActivity = z.infer<typeof SfmcActivitySchema>
export type SfmcStep     = z.infer<typeof SfmcStepSchema>
export type SfmcSchedule = z.infer<typeof SfmcScheduleSchema>
export type SfmcAutomation = z.infer<typeof SfmcAutomationSchema>

// Automation enriched with computed/mapped fields for display
export interface SfmcAutomationEnriched extends SfmcAutomation {
  mappedStatus:  Status
  statusLabel:   string
  activityCount: number
}

// Filters accepted by the automations list hook
export interface SfmcAutomationFilters {
  statusId?: number
  search?:   string
}
