export type Status = 'healthy' | 'degraded' | 'critical' | 'info' | 'unknown'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'
export type Severity = 'critical' | 'degraded' | 'info'

export interface ApiResponse<T> {
  data: T
  message?: string
}
export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}
