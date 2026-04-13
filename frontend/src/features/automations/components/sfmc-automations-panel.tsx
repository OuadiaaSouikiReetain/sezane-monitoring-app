import { useState, useMemo, useCallback } from 'react'
import {
  Activity, AlertCircle, Clock, Loader2, RefreshCw, Search, Zap,
  CheckCircle2, XCircle, PauseCircle,
} from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useSfmcAutomations } from '../hooks/use-sfmc-automations'
import { AutomationDrawer } from './automation-drawer'
import type { SfmcAutomationEnriched } from '../types/automation.types'
import type { Status } from '@/shared/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | Status

// ─── Table row ────────────────────────────────────────────────────────────────

function AutomationRow({
  automation,
  onClick,
}: {
  automation: SfmcAutomationEnriched
  onClick:    (a: SfmcAutomationEnriched) => void
}) {
  const lastRun = automation.lastRunTime
    ? new Date(automation.lastRunTime).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

  const scheduleRaw =
    automation.startSource?.schedule?.icalRecur ??
    automation.startSource?.schedule?.scheduledTime ??
    null

  return (
    <tr
      className="cursor-pointer hover:bg-white/[0.03] transition-colors group"
      onClick={() => onClick(automation)}
    >
      {/* Name */}
      <td>
        <div>
          <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">
            {automation.name}
          </p>
          {automation.description && (
            <p className="text-[11px] text-slate-600 mt-0.5 max-w-[260px] truncate">
              {automation.description}
            </p>
          )}
        </div>
      </td>

      {/* Key */}
      <td>
        <span className="font-mono text-[11px] text-slate-500">{automation.key ?? '—'}</span>
      </td>

      {/* Status */}
      <td>
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={automation.mappedStatus} />
          <span className="text-[10px] text-slate-600">{automation.statusLabel}</span>
        </div>
      </td>

      {/* Schedule */}
      <td>
        <span className="text-[11px] text-slate-400 font-mono">{scheduleRaw ?? '—'}</span>
      </td>

      {/* Last run */}
      <td>
        <span className="text-[12px] text-slate-400">{lastRun}</span>
      </td>

      {/* Arrow hint */}
      <td className="w-8">
        <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-[14px]">›</span>
      </td>
    </tr>
  )
}

// ─── Filter pill button ────────────────────────────────────────────────────────

function FilterPill({
  label,
  count,
  active,
  colorCls,
  onClick,
}: {
  label:    string
  count:    number
  active:   boolean
  colorCls: string
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
        border transition-all duration-150
        ${active
          ? `${colorCls} shadow-sm`
          : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:border-white/[0.12] hover:text-slate-300'}
      `}
    >
      {label}
      <span className={`
        text-[10px] px-1.5 py-0.5 rounded-full font-bold
        ${active ? 'bg-black/20' : 'bg-white/[0.06]'}
      `}>
        {count}
      </span>
    </button>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function SfmcAutomationsPanel() {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected]         = useState<SfmcAutomationEnriched | null>(null)

  const { automations, isLoading, isError, error, refetch, isFetching } =
    useSfmcAutomations(search ? { search } : undefined)

  const stats = useMemo(() => ({
    total:    automations.length,
    healthy:  automations.filter((a) => a.mappedStatus === 'healthy').length,
    degraded: automations.filter((a) => a.mappedStatus === 'degraded').length,
    critical: automations.filter((a) => a.mappedStatus === 'critical').length,
    unknown:  automations.filter((a) => a.mappedStatus === 'unknown').length,
  }), [automations])

  const filtered = useMemo(() =>
    statusFilter === 'all'
      ? automations
      : automations.filter((a) => a.mappedStatus === statusFilter),
    [automations, statusFilter],
  )

  const handleRowClick = useCallback((a: SfmcAutomationEnriched) => setSelected(a), [])
  const handleClose    = useCallback(() => setSelected(null), [])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center gap-3">
        <Loader2 size={20} className="animate-spin text-primary-light" />
        <p className="text-slate-400 text-[13px]">Loading SFMC automations…</p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="card p-6 border border-danger/20 space-y-3">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <p className="text-[14px] font-semibold text-danger">Failed to load SFMC automations</p>
        </div>
        <p className="text-[12px] text-slate-500 font-mono leading-relaxed">
          {(error as Error)?.message ?? 'Unknown error'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-[12px] text-primary hover:text-primary-light transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    )
  }

  // ── Content ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5 animate-slide-up">

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total',    value: stats.total,    cls: 'text-primary-light bg-primary/10 border-primary/20',  Icon: Zap          },
            { label: 'Healthy',  value: stats.healthy,  cls: 'text-success bg-success/10 border-success/20',        Icon: CheckCircle2 },
            { label: 'Degraded', value: stats.degraded, cls: 'text-warning bg-warning/10 border-warning/20',        Icon: PauseCircle  },
            { label: 'Critical', value: stats.critical, cls: 'text-danger bg-danger/10 border-danger/20',           Icon: XCircle      },
          ].map(({ label, value, cls, Icon }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(
                label === 'Total' ? 'all' : (label.toLowerCase() as Status)
              )}
              className={`
                card-hover rounded-2xl p-4 flex items-center gap-4 text-left
                transition-all duration-150
                ${statusFilter === (label === 'Total' ? 'all' : label.toLowerCase())
                  ? 'ring-1 ring-white/20 bg-white/[0.04]'
                  : ''}
              `}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cls}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="card overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex flex-wrap items-center gap-3">

            {/* Title */}
            <p className="section-title shrink-0">SFMC Automations</p>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-1">
              <FilterPill
                label="All"     count={stats.total}    active={statusFilter === 'all'}      colorCls="bg-primary/10 border-primary/30 text-primary-light"  onClick={() => setStatusFilter('all')}      />
              <FilterPill
                label="Healthy" count={stats.healthy}  active={statusFilter === 'healthy'}  colorCls="bg-success/10 border-success/30 text-success"         onClick={() => setStatusFilter('healthy')}  />
              <FilterPill
                label="Degraded" count={stats.degraded} active={statusFilter === 'degraded'} colorCls="bg-warning/10 border-warning/30 text-warning"         onClick={() => setStatusFilter('degraded')} />
              <FilterPill
                label="Critical" count={stats.critical} active={statusFilter === 'critical'} colorCls="bg-danger/10 border-danger/30 text-danger"            onClick={() => setStatusFilter('critical')} />
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search automations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Count + spinner */}
            <div className="flex items-center gap-2 shrink-0">
              {isFetching && <Loader2 size={13} className="animate-spin text-slate-500" />}
              <span className="section-sub">{filtered.length} automation{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {['Name', 'Key', 'Status', 'Schedule', 'Last Run', ''].map(
                    (h) => <th key={h}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-600 text-[13px]">
                      {automations.length === 0 ? 'No automations found' : 'No automations match this filter'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <AutomationRow key={a.id} automation={a} onClick={handleRowClick} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer — rendered outside the table to avoid stacking context issues */}
      <AutomationDrawer automation={selected} onClose={handleClose} />
    </>
  )
}
