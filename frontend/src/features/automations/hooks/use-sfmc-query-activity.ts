/**
 * useSfmcQueryActivity
 * ────────────────────
 * Fetches the SQL text + target DE for a SFMC Query Activity.
 * Only fires when `enabled = true` (lazy — user clicks to expand).
 *
 * Endpoint: GET /automation/v1/activities/queryactivities/{activityObjectId}
 */

import { useQuery } from '@tanstack/react-query'
import { sfmcGet } from '@/shared/api/sfmc-client'

export interface SfmcQueryActivityDetail {
  id?:          string
  name?:        string
  description?: string
  queryText?:   string
  targetUpdateTypeId?: number   // 1 = Append, 2 = Overwrite, 3 = Update
  dataExtensionTarget?: {
    r__dataExtension_key?: string  // external key (= DE name usually)
    name?:                 string
    targetUpdateTypeId?:   number
  }
  status?: number
}

const UPDATE_LABEL: Record<number, string> = {
  1: 'Append',
  2: 'Overwrite',
  3: 'Update',
}

export function getUpdateLabel(typeId?: number | null): string {
  return typeId ? (UPDATE_LABEL[typeId] ?? `Type ${typeId}`) : '—'
}

export function useSfmcQueryActivity(
  activityObjectId: string | null | undefined,
  enabled = false,
) {
  return useQuery({
    queryKey:  ['sfmc-query-activity', activityObjectId],
    queryFn:   () =>
      sfmcGet<SfmcQueryActivityDetail>(
        `/automation/v1/activities/queryactivities/${activityObjectId}`,
      ),
    enabled:   !!activityObjectId && enabled,
    staleTime: 10 * 60 * 1000,   // SQL queries change rarely
    retry:     1,
  })
}
