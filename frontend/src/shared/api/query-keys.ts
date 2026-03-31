export const queryKeys = {
  overview: {
    all: () => ['overview'] as const,
    kpis: () => ['overview', 'kpis'] as const,
    activity: () => ['overview', 'activity'] as const,
  },
  journeys: {
    all: () => ['journeys'] as const,
    list: (filters?: Record<string, unknown>) => ['journeys', 'list', filters] as const,
    detail: (id: number) => ['journeys', 'detail', id] as const,
  },
  automations: {
    all: () => ['automations'] as const,
    list: (filters?: Record<string, unknown>) => ['automations', 'list', filters] as const,
    detail: (id: number) => ['automations', 'detail', id] as const,
  },
  apiHealth: {
    all: () => ['api-health'] as const,
    list: () => ['api-health', 'list'] as const,
  },
  anomalies: {
    all: () => ['anomalies'] as const,
    list: (filters?: Record<string, unknown>) => ['anomalies', 'list', filters] as const,
    detail: (id: number) => ['anomalies', 'detail', id] as const,
  },
  alerts: {
    all: () => ['alerts'] as const,
    list: (filters?: Record<string, unknown>) => ['alerts', 'list', filters] as const,
  },
  analytics: {
    all: () => ['analytics'] as const,
    kpis: () => ['analytics', 'kpis'] as const,
    trend: () => ['analytics', 'trend'] as const,
  },
  settings: {
    all: () => ['settings'] as const,
    rules: () => ['settings', 'rules'] as const,
  },
}
