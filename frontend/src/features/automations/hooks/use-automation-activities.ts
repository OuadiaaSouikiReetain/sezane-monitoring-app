/**
 * useAutomationActivities
 * ───────────────────────
 * Fetches full automation detail + activities via Django backend.
 * Results are persisted in localStorage so that:
 *   - data survives page refresh
 *   - fields missing from the SFMC endpoint (createdBy, SQL details…)
 *     are supplemented from the previous successful response
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface QueryDetail {
  queryText?:          string | null
  targetDE?:           string | null
  targetUpdateTypeId?: number | null
}

export interface ScriptDetail {
  script?:       string | null
  description?:  string | null
  createdDate?:  string | null
  modifiedDate?: string | null
}

export interface ActivityDetailField {
  label: string
  value: string
}

export interface GenericActivityDetail {
  type:   string
  fields: ActivityDetailField[]
}

export interface ActivityDetail {
  id:                string
  name:              string
  activityObjectId?: string | null
  activityTypeId:    number
  activityType?:     string | null
  activityTypeName?: string | null
  isActive?:         boolean | null
  queryDetail?:      QueryDetail
  scriptDetail?:     ScriptDetail
  activityDetail?:   GenericActivityDetail
}

export interface StepDetail {
  id:          string
  name:        string
  stepNumber?: number
  activities:  ActivityDetail[]
}

export interface AutomationActivitiesResponse {
  id:            string
  name:          string
  steps:         StepDetail[]
  schedule?:     unknown
  createdBy?:    unknown
  modifiedBy?:   unknown
  lastSavedBy?:  unknown
  createdDate?:  string | null
  modifiedDate?: string | null
  lastRunTime?:  string | null
  [key: string]: unknown
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_PREFIX = 'automation_activities_v1_'

function storageKey(sfmcId: string) {
  return `${STORAGE_PREFIX}${sfmcId}`
}

function readCache(sfmcId: string): AutomationActivitiesResponse | undefined {
  try {
    const raw = localStorage.getItem(storageKey(sfmcId))
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function writeCache(sfmcId: string, data: AutomationActivitiesResponse) {
  try {
    localStorage.setItem(storageKey(sfmcId), JSON.stringify(data))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

/**
 * Merge fresh data with cached data so that fields present in cache
 * but missing/null in fresh response are preserved.
 */
function mergeWithCache(
  fresh: AutomationActivitiesResponse,
  cached: AutomationActivitiesResponse | undefined,
): AutomationActivitiesResponse {
  if (!cached) return fresh

  // Top-level scalar fields: prefer fresh if non-null, else cached
  const merged: AutomationActivitiesResponse = { ...cached, ...fresh }

  const scalarFields = [
    'createdBy', 'modifiedBy', 'lastSavedBy', 'lastPausedBy',
    'createdDate', 'modifiedDate', 'lastSavedDate', 'lastPausedDate',
    'categoryId', 'categoryName', 'folderId', 'isActive', 'type', 'typeId', 'key',
  ] as const
  for (const field of scalarFields) {
    if (fresh[field] == null && cached[field] != null) {
      merged[field] = cached[field]
    }
  }

  // Steps: merge activity-level queryDetail from cache when fresh has none
  const cachedStepIdx = new Map<string, StepDetail>()
  for (const s of cached.steps ?? []) cachedStepIdx.set(s.id, s)

  merged.steps = (fresh.steps ?? []).map(step => {
    const cachedStep = cachedStepIdx.get(step.id)
    if (!cachedStep) return step

    const cachedActIdx = new Map<string, ActivityDetail>()
    for (const a of cachedStep.activities) cachedActIdx.set(a.id, a)

    return {
      ...step,
      activities: step.activities.map(act => {
        const cachedAct = cachedActIdx.get(act.id)
        if (!cachedAct) return act
        return {
          ...act,
          // Keep cached SQL if fresh didn't return it
          queryDetail:      act.queryDetail      ?? cachedAct.queryDetail,
          activityTypeId:   act.activityTypeId   || cachedAct.activityTypeId,
          activityType:     act.activityType     ?? cachedAct.activityType,
          activityTypeName: act.activityTypeName ?? cachedAct.activityTypeName,
        }
      }),
    }
  })

  return merged
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchActivities(sfmcId: string): Promise<AutomationActivitiesResponse> {
  const { data } = await axios.get<AutomationActivitiesResponse>(
    `/api/automations/${sfmcId}/activities/`,
  )
  const cached  = readCache(sfmcId)
  const merged  = mergeWithCache(data, cached)
  writeCache(sfmcId, merged)
  return merged
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutomationActivities(sfmcId: string | undefined) {
  const cached = sfmcId ? readCache(sfmcId) : undefined

  return useQuery({
    queryKey:    ['automation-activities', sfmcId],
    queryFn:     () => fetchActivities(sfmcId!),
    enabled:     !!sfmcId,
    initialData: cached,          // show cached immediately while fetching
    staleTime:   5 * 60 * 1000,
    retry:       1,
  })
}
