import { useState } from 'react'
import { useJourneys } from '../hooks/use-journeys'
import { JourneyFiltersBar } from './journey-filters'
import { JourneyTable } from './journey-table'
import { journeys as mockJourneys } from '@/mocks/data'
import type { JourneyFilters } from '../types/journey.types'

interface StatPillProps {
  value: number
  label: string
  color: 'green' | 'amber' | 'red' | 'neutral'
}

function StatPill({ value, label, color }: StatPillProps) {
  const colors = {
    green:   'bg-success/10 border-success/20',
    amber:   'bg-warning/10 border-warning/20',
    red:     'bg-danger/10  border-danger/20',
    neutral: 'bg-white/[0.04] border-white/[0.06]',
  }
  const textColors = {
    green:   'text-success',
    amber:   'text-warning',
    red:     'text-danger',
    neutral: 'text-white',
  }
  return (
    <div className={`card-hover rounded-2xl p-4 border ${colors[color]} flex items-center gap-4`}>
      <span className={`text-3xl font-bold tracking-tight ${textColors[color]}`}>{value}</span>
      <span className="text-[12px] text-slate-500 font-medium leading-tight">{label}</span>
    </div>
  )
}

export function JourneysPage() {
  const [filters, setFilters] = useState<JourneyFilters>({ bu: 'All', status: 'All' })

  const { data: queryResult } = useJourneys(filters)
  const allJourneys = queryResult?.results ?? mockJourneys

  const filteredJourneys = allJourneys.filter((j) =>
    (filters.bu === 'All'     || j.bu === filters.bu) &&
    (filters.status === 'All' || j.status === filters.status)
  )

  const setFilter = <K extends keyof JourneyFilters>(key: K, value: JourneyFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stat Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatPill value={allJourneys.length}                                          label="Total Journeys" color="neutral" />
        <StatPill value={allJourneys.filter((j) => j.status === 'healthy').length}   label="Healthy"        color="green"   />
        <StatPill value={allJourneys.filter((j) => j.status === 'degraded').length}  label="Degraded"       color="amber"   />
        <StatPill value={allJourneys.filter((j) => j.status === 'critical').length}  label="Critical"       color="red"     />
      </div>

      {/* Filters */}
      <JourneyFiltersBar
        filters={filters}
        onFilter={setFilter}
        resultCount={filteredJourneys.length}
      />

      {/* Table */}
      <JourneyTable journeys={filteredJourneys} total={allJourneys.length} />
    </div>
  )
}
