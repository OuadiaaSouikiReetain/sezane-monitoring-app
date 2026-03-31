import { useState, useCallback } from 'react'

export function useFilters<T extends Record<string, unknown>>(initial: T) {
  const [filters, setFilters] = useState<T>(initial)

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(initial), [initial])

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v !== '' && v !== 'All' && v !== null && v !== undefined
  )

  return { filters, setFilter, resetFilters, activeCount: activeFilters.length }
}
