import { z } from 'zod'

const statusSchema = z.enum(['healthy', 'degraded', 'critical', 'info', 'unknown'])

export const automationSchema = z.object({
  id: z.number(),
  name: z.string(),
  frequency: z.string(),
  lastRun: z.string(),
  duration: z.string(),
  status: statusSchema,
  delay: z.boolean(),
})

export type AutomationSchema = z.infer<typeof automationSchema>
