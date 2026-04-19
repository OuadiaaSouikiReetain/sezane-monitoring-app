import { useState, useMemo, useCallback } from 'react'
import {
  AlertCircle,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  Users,
  CheckCircle,
  PauseCircle,
} from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useSfmcJourneys } from '../hooks/use-sfmc-journeys'
import { JourneyDrawer } from './journey-drawer'
import type { SfmcJourneyEnriched } from '../types/sfmc-journey.types'

function fmt(n?: number): string {
  if (n === undefined || n === null) return '—'
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n)
}

/**
 * SfmcJourneysPanel
 *
 * Affiche toutes les journeys Journey Builder récupérées directement depuis SFMC.
 * Stats globales + table avec statut, population, type, dates.
 */
export function SfmcJourneysPanel() {
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<SfmcJourneyEnriched | null>(null)

  const { journeys, isLoading, isError, error, refetch, isFetching } =
    useSfmcJourneys(search ? { search } : undefined)

  const handleRowClick = useCallback((j: SfmcJourneyEnriched) => setSelected(j), [])
  const handleClose    = useCallback(() => setSelected(null), [])

  const stats = useMemo(() => ({
    total:    journeys.length,
    healthy:  journeys.filter((j) => j.mappedStatus === 'healthy').length,
    degraded: journeys.filter((j) => j.mappedStatus === 'degraded').length,
    population: journeys.reduce((sum, j) => sum + (j.stats?.currentPopulation ?? 0), 0),
  }), [journeys])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center gap-3">
        <Loader2 size={20} className="animate-spin text-primary" />
        <p className="text-ink-muted text-[13px]">Loading SFMC journeys…</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    const message = (error as Error)?.message ?? 'Unknown error'
    return (
      <div className="card p-6 border border-danger-border space-y-3">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <p className="text-[14px] font-semibold text-danger">Failed to load SFMC journeys</p>
        </div>
        <p className="text-[12px] text-ink-muted font-mono leading-relaxed">{message}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-[12px] text-primary hover:text-primary-dark transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    )
  }

  // ── Content ──────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="space-y-5 animate-slide-up">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Journeys', value: stats.total,           cls: 'text-primary bg-primary-bg border-primary-border',  Icon: GitBranch   },
          { label: 'Active',         value: stats.healthy,         cls: 'text-success bg-success-bg border-success-border',  Icon: CheckCircle },
          { label: 'Stopped / Draft',value: stats.degraded,        cls: 'text-warning bg-warning-bg border-warning-border',  Icon: PauseCircle },
          { label: 'In Journey Now', value: fmt(stats.population), cls: 'text-info bg-info-bg border-info-border',           Icon: Users       },
        ].map(({ label, value, cls, Icon }) => (
          <div key={label} className="card-hover rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cls}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink leading-none">{value}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
          <p className="section-title shrink-0">SFMC Journeys</p>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              type="text"
              placeholder="Search journeys…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-bg border border-border rounded-lg text-ink placeholder:text-ink-faint focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-ink/10"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isFetching && <Loader2 size={13} className="animate-spin text-ink-muted" />}
            <span className="section-sub">{journeys.length} journeys</span>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Name', 'Status', 'Type', 'In Journey', 'Total Entries', 'Exited', 'Last Published'].map(
                  (h) => <th key={h}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {journeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-muted text-[13px]">
                    No journeys found
                  </td>
                </tr>
              ) : (
                journeys.map((j) => (
                  <tr
                    key={j.id}
                    className="cursor-pointer hover:bg-bg transition-colors group"
                    onClick={() => handleRowClick(j)}
                  >
                    <td>
                      <div>
                        <p className="font-semibold text-ink">{j.name}</p>
                        {j.description && (
                          <p className="text-[11px] text-ink-faint mt-0.5 max-w-[220px] truncate">
                            {j.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <StatusBadge status={j.mappedStatus} />
                        <span className="text-[10px] text-ink-faint">{j.status}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[11px] text-ink-muted">{j.typeLabel}</span>
                    </td>
                    <td>
                      <span className="font-mono text-[13px] text-ink-sub">
                        {fmt(j.stats?.currentPopulation)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[13px] text-ink-sub">
                        {fmt(j.stats?.cumulativePopulation)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[13px] text-ink-sub">
                        {fmt(j.stats?.exited)}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px] text-ink-muted">
                        {j.lastPublishedDate
                          ? new Date(j.lastPublishedDate).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      <JourneyDrawer journey={selected} onClose={handleClose} />
    </>
  )
}
