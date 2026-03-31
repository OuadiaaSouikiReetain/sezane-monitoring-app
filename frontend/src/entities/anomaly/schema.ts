import { z } from 'zod'

const anomalyTypeSchema = z.enum(['Automation Delay', 'API Timeout', 'Journey Drop', 'KPI Anomaly'])
const severitySchema = z.enum(['critical', 'degraded', 'info'])

export const anomalySchema = z.object({
  id: z.number(),
  type: anomalyTypeSchema,
  description: z.string(),
  severity: severitySchema,
  impact: z.string(),
  time: z.string(),
  journey: z.string().nullable(),
})

export type AnomalySchemaType = z.infer<typeof anomalySchema>
