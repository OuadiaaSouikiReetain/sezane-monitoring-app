import { SlidersHorizontal } from 'lucide-react'
import { BUS, STATUSES } from '@/shared/constants'
import type { JourneyFilters } from '../types/journey.types'

interface JourneyFiltersProps {
  filters: JourneyFilters
  onFilter: <K extends keyof JourneyFilters>(key: K, value: JourneyFilters[K]) => void
  resultCount: number
}

export function JourneyFiltersBar({ filters, onFilter, resultCount }: JourneyFiltersProps) {
  return (
    <div className="card p-4 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wide pr-3 border-r border-white/[0.06]">
        <SlidersHorizontal size={13} />
        Filters
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {BUS.map((b) => (
          <button
            key={b}
            onClick={() => onFilter('bu', b)}
            className={filters.bu === b ? 'filter-pill-active' : 'filter-pill-inactive'}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-white/[0.06] mx-1" />

      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onFilter('status', s)}
            className={filters.status === s ? 'filter-pill-active' : 'filter-pill-inactive capitalize'}
          >
            {s}
          </button>
        ))}
      </div>

      <span className="ml-auto text-[11px] text-slate-600">
        {resultCount} result{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
