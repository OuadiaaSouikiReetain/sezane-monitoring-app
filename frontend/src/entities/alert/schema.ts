import { z } from 'zod'

const severitySchema = z.enum(['critical', 'degraded', 'info'])
const alertStatusSchema = z.enum(['open', 'acknowledged', 'resolved'])
const alertChannelSchema = z.enum(['Slack + Email', 'Email + SMS', 'PagerDuty', 'Slack', 'Email'])

export const alertSchema = z.object({
  id: z.number(),
  title: z.string(),
  severity: severitySchema,
  recipient: z.string(),
  channel: alertChannelSchema,
  escalated: z.boolean(),
  time: z.string(),
  status: alertStatusSchema,
})

export type AlertSchemaType = z.infer<typeof alertSchema>
