export const STALE_TIMES = {
  realtime: 10_000,   // 10s
  frequent: 30_000,  // 30s
  standard: 60_000,  // 1min
  slow: 300_000,     // 5min
} as const

export const POLLING_INTERVALS = {
  fast: 15_000,
  standard: 60_000,
  slow: 300_000,
} as const

export const BUS = ['All', 'France', 'Belgium', 'Germany', 'Spain', 'UK', 'Italy'] as const
export type BU = typeof BUS[number]

export const STATUSES = ['All', 'healthy', 'degraded', 'critical'] as const
