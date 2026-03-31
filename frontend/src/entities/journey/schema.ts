import { z } from 'zod'

const statusSchema = z.enum(['healthy', 'degraded', 'critical', 'info', 'unknown'])

export const journeySchema = z.object({
  id: z.number(),
  name: z.string(),
  bu: z.string(),
  owner: z.string(),
  status: statusSchema,
  entries: z.number(),
  sla: z.number(),
  anomalies: z.number(),
})

export type JourneySchema = z.infer<typeof journeySchema>
