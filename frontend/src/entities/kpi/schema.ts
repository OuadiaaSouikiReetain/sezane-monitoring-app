import { z } from 'zod'

export const kpiDataSchema = z.object({
  journeys: z.object({
    total: z.number(),
    healthy: z.number(),
    degraded: z.number(),
    critical: z.number(),
  }),
  automations: z.object({
    total: z.number(),
    healthy: z.number(),
    degraded: z.number(),
    critical: z.number(),
  }),
  incidents: z.object({
    open: z.number(),
    resolved: z.number(),
    mttr: z.string(),
  }),
  apiLatency: z.object({
    avg: z.number(),
    p95: z.number(),
    p99: z.number(),
  }),
})

export const apiHealthSchema = z.object({
  name: z.string(),
  latency: z.number(),
  p95: z.number(),
  successRate: z.number(),
  status: z.enum(['healthy', 'degraded', 'critical']),
  uptime: z.string(),
})

export const activityPointSchema = z.object({
  time: z.string(),
  success: z.number(),
  failures: z.number(),
})

export type KpiDataSchema = z.infer<typeof kpiDataSchema>
export type ApiHealthSchema = z.infer<typeof apiHealthSchema>
