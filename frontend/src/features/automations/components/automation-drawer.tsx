import { useEffect, useMemo, useState } from 'react'
import {
  X, Cog, Calendar, Clock, Layers, Activity,
  AlertCircle, ChevronRight, RefreshCw,
  XCircle, TrendingUp, CheckCircle2,
  BarChart2, Timer, AlertTriangle, Hash,
  Zap, Heart, Gauge, ArrowUpRight, User, Pause,
  CheckCircle, Minus, Loader2, Database,
  Folder, Bell, Mail, Tag, Power,
} from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useAutomationActivities }  from '../hooks/use-automation-activities'
import type { StepDetail, ActivityDetail } from '../hooks/use-automation-activities'
import { useAutomationKpis }        from '../hooks/use-automation-kpis'
import { useAutomationExecutions }  from '../hooks/use-automation-executions'
import { EmailKpiSection }          from '@/shared/components/email-kpi-section'
import type { ExecutionLogRow }      from '../hooks/use-automation-executions'
import type {
  ReliabilityKpis, PerformanceKpis, ActivityKpis, CompositeKpis,
} from '../hooks/use-automation-kpis'
import {
  resolveActivityLabel,
  extractUserName,
  SFMC_STATUS_LABEL,
  type SfmcAutomationEnriched,
} from '../types/automation.types'

const UPDATE_LABEL: Record<number, string> = { 1: 'Append', 2: 'Overwrite', 3: 'Update' }
function getUpdateLabel(id?: number | null) { return id ? (UPDATE_LABEL[id] ?? `Type ${id}`) : '—' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseIcal(ical?: string | null): string {
  if (!ical) return '—'
  const freq     = ical.match(/FREQ=(\w+)/)?.[1]
  const interval = ical.match(/INTERVAL=(\d+)/)?.[1]
  const byday    = ical.match(/BYDAY=([\w,]+)/)?.[1]
  const byhour   = ical.match(/BYHOUR=(\d+)/)?.[1]
  const days: Record<string, string> = { MO:'Mon',TU:'Tue',WE:'Wed',TH:'Thu',FR:'Fri',SA:'Sat',SU:'Sun' }
  const dayLabel = byday?.split(',').map((d) => days[d] ?? d).join(', ')
  if (freq === 'DAILY')   return byhour ? `Daily at ${byhour}:00` : interval ? `Every ${interval} day(s)` : 'Daily'
  if (freq === 'WEEKLY')  return dayLabel ? `Weekly — ${dayLabel}` : 'Weekly'
  if (freq === 'HOURLY')  return interval ? `Every ${interval}h` : 'Hourly'
  if (freq === 'MONTHLY') return 'Monthly'
  return ical
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDur(sec: number | null | undefined): string {
  if (sec == null) return '—'
  if (sec < 60)    return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function fmtHours(h: number | null | undefined): string {
  if (h == null) return '—'
  if (h < 1)     return `${Math.round(h * 60)}m`
  if (h < 24)    return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${(v * 100).toFixed(1)}%`
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, badge }: {
  icon: React.ElementType; title: string; badge?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted flex items-center gap-1.5">
        <Icon size={11} />
        {title}
      </p>
      {badge && (
        <span className="text-[10px] text-ink-faint bg-elevated border border-border px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value, sub, cls = '' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; cls?: string
}) {
  return (
    <div className="bg-bg border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-ink-faint mb-1.5">
        <Icon size={10} />
        <span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-[20px] font-bold leading-none ${cls || 'text-ink'}`}>{value}</span>
        {sub && <span className="text-[10px] text-ink-faint mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function KpiSkeleton({ cols = 2, rows = 1 }: { cols?: number; rows?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-2 animate-pulse`}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="h-16 bg-elevated rounded-xl border border-border" />
      ))}
    </div>
  )
}

// ─── Groupe 1 : Reliability ───────────────────────────────────────────────────

function ReliabilitySection({ data, isLoading }: {
  data?: ReliabilityKpis; isLoading: boolean
}) {
  const sr  = data ? data.success_rate * 100 : null
  const er  = data ? data.error_rate  * 100 : null

  const srCls =
    sr === null ? 'text-ink-muted' :
    sr >= 95    ? 'text-success'   :
    sr >= 80    ? 'text-warning'   : 'text-danger'

  const erCls =
    er === null ? 'text-ink-muted' :
    er === 0    ? 'text-success'   :
    er < 10     ? 'text-warning'   : 'text-danger'

  const ccCls =
    !data                         ? 'text-ink-muted' :
    data.consecutive_failures === 0 ? 'text-success'  :
    data.consecutive_failures < 3   ? 'text-warning'  : 'text-danger'

  return (
    <div className="px-6 py-5 border-b border-border">
      <SectionHeader icon={BarChart2} title="Reliability" badge={data ? `${data.total_runs} runs` : undefined} />

      {isLoading && <KpiSkeleton cols={2} rows={2} />}

      {!isLoading && !data && (
        <p className="text-[11px] text-ink-faint italic text-center py-3">
          No run data available yet
        </p>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatTile icon={CheckCircle2} label="Success Rate"
              value={sr != null ? `${sr.toFixed(1)}%` : '—'}
              sub={`${data.success_count}/${data.total_runs} runs`}
              cls={srCls} />

            <StatTile icon={XCircle} label="Error Rate"
              value={er != null ? `${er.toFixed(1)}%` : '—'}
              sub={`${data.error_count} error${data.error_count !== 1 ? 's' : ''}`}
              cls={erCls} />

            <StatTile icon={AlertTriangle} label="Consec. Errors"
              value={String(data.consecutive_failures)}
              sub={data.consecutive_failures === 0 ? 'all good' : data.consecutive_failures < 3 ? 'watch' : 'critical'}
              cls={ccCls} />

            <StatTile icon={Clock} label="Since Last OK"
              value={fmtHours(data.time_since_last_success_hours)}
              sub={data.time_since_last_run_hours != null ? `last run ${fmtHours(data.time_since_last_run_hours)} ago` : undefined} />
          </div>

          {sr !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-ink-faint">
                <span>Success rate over {data.total_runs} runs</span>
                <span className={srCls}>{sr.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sr >= 95 ? 'bg-success' : sr >= 80 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${sr}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Groupe 2 : Performance ───────────────────────────────────────────────────

function PerformanceSection({ data, isLoading }: {
  data?: PerformanceKpis; isLoading: boolean
}) {
  if (!isLoading && !data) return null

  return (
    <div className="px-6 py-5 border-b border-border">
      <SectionHeader icon={Timer} title="Performance" />

      {isLoading && <KpiSkeleton cols={4} rows={1} />}

      {!isLoading && data && (
        <div className="grid grid-cols-4 gap-2">
          <StatTile icon={Gauge}       label="Avg"  value={fmtDur(data.avg_duration_seconds)} />
          <StatTile icon={ArrowUpRight} label="Max" value={fmtDur(data.max_duration_seconds)} />
          <StatTile icon={Timer}       label="P95"  value={fmtDur(data.p95_duration_seconds)} />
          <StatTile icon={Zap}         label="Min"  value={fmtDur(data.min_duration_seconds)} />
        </div>
      )}
    </div>
  )
}

// ─── Groupe 3 : Activity Health ───────────────────────────────────────────────

function ActivityHealthSection({ data, isLoading }: {
  data?: ActivityKpis; isLoading: boolean
}) {
  if (!isLoading && (!data || data.breakdown.length === 0)) return null

  return (
    <div className="px-6 py-5 border-b border-border">
      <SectionHeader icon={Activity} title="Activity Health" />

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map(i => <div key={i} className="h-16 bg-elevated rounded-xl border border-border" />)}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-2">
          {data.breakdown.map((act) => {
            const er     = act.error_rate * 100
            const erCls  = er === 0 ? 'text-success' : er < 20 ? 'text-warning' : 'text-danger'
            const barCls = er === 0 ? 'bg-success'   : er < 20 ? 'bg-warning'   : 'bg-danger'
            return (
              <div key={act.name} className="p-2.5 rounded-xl bg-bg border border-border">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-elevated text-ink-muted border-border flex-shrink-0">
                    {act.type || '—'}
                  </span>
                  <span className="text-[12px] font-medium text-ink truncate flex-1">{act.name}</span>
                  <span className={`text-[11px] font-mono font-bold flex-shrink-0 ${erCls}`}>
                    {er.toFixed(0)}% err
                  </span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full ${barCls}`} style={{ width: `${Math.min(er, 100)}%` }} />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-ink-faint">
                  <span>{act.total_runs} run{act.total_runs !== 1 ? 's' : ''}</span>
                  {act.error_count > 0 && (
                    <span className="text-danger">{act.error_count} error{act.error_count !== 1 ? 's' : ''}</span>
                  )}
                  <span className="ml-auto">avg {fmtDur(act.avg_duration_seconds)}</span>
                </div>
                {act.last_error && (
                  <p className="mt-1.5 text-[10px] font-mono text-danger bg-danger-bg border border-danger-border px-2 py-1 rounded-lg truncate">
                    {act.last_error}
                  </p>
                )}
              </div>
            )
          })}

          {data.top_errors.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">Recurring errors</p>
              <div className="space-y-1">
                {data.top_errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-danger font-mono font-bold shrink-0">×{e.count}</span>
                    <span className="text-ink-muted font-mono truncate">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Groupe 4 : Composite ─────────────────────────────────────────────────────

function CompositeSection({ data, isLoading }: {
  data?: CompositeKpis; isLoading: boolean
}) {
  if (!isLoading && !data) return null

  const score    = data ? Math.round(data.health_score * 100) : null
  const scoreCls =
    score === null ? 'text-ink' :
    score >= 85    ? 'text-success' :
    score >= 60    ? 'text-warning' : 'text-danger'

  return (
    <div className="px-6 py-5 border-b border-border">
      <SectionHeader icon={Heart} title="Health Score" />

      {isLoading && <KpiSkeleton cols={3} rows={1} />}

      {!isLoading && data && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={Heart}  label="Health Score"
            value={score != null ? `${score}` : '—'}
            sub="/ 100" cls={scoreCls} />
          <StatTile icon={BarChart2} label="MTBF"
            value={fmtHours(data.mtbf_hours)}
            sub="between failures" />
          <StatTile icon={RefreshCw} label="MTTR"
            value={fmtHours(data.mttr_hours)}
            sub="to recover" />
        </div>
      )}
    </div>
  )
}

// ─── Run status badge (inline, no shared dep) ─────────────────────────────────

const RUN_STATUS: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  success:  { icon: CheckCircle, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Success'  },
  complete: { icon: CheckCircle, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Success'  },
  error:    { icon: XCircle,     cls: 'text-red-700 bg-red-50 border-red-200',             label: 'Error'    },
  running:  { icon: Loader2,     cls: 'text-ink-sub bg-elevated border-border',            label: 'Running'  },
  paused:   { icon: Pause,       cls: 'text-amber-700 bg-amber-50 border-amber-200',       label: 'Paused'   },
  skipped:  { icon: Minus,       cls: 'text-ink-muted bg-elevated border-border',          label: 'Skipped'  },
}

function RunStatusBadge({ status }: { status: string }) {
  const cfg = RUN_STATUS[status?.toLowerCase()] ?? { icon: Minus, cls: 'text-ink-muted bg-elevated border-border', label: status }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${cfg.cls}`}>
      <Icon size={9} className={status === 'running' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  )
}

// ─── Grouped runs section (automation run + its activities) ───────────────────

function RunsSection({ items, isLoading, isError, refetch }: {
  items: ExecutionLogRow[]; isLoading: boolean; isError: boolean; refetch: () => void
}) {
  // Group by sfmc_instance_id: one parent row (activity_id=null) + child activity rows
  const groups = useMemo(() => {
    const map = new Map<string, { auto: ExecutionLogRow | null; activities: ExecutionLogRow[] }>()
    for (const row of items) {
      const key = row.sfmc_instance_id || row.id_log
      if (!map.has(key)) map.set(key, { auto: null, activities: [] })
      const g = map.get(key)!
      if (!row.activity_id) g.auto = row
      else                  g.activities.push(row)
    }
    return [...map.values()]
      .filter(g => g.auto !== null)
      .sort((a, b) => {
        const ta = a.auto?.start_time ? +new Date(a.auto.start_time) : 0
        const tb = b.auto?.start_time ? +new Date(b.auto.start_time) : 0
        return tb - ta
      })
      .slice(0, 10)
  }, [items])

  return (
    <div className="px-6 py-5 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted flex items-center gap-1.5">
          <Clock size={11} />
          Recent Runs
        </p>
        {!isLoading && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-ink-faint bg-elevated border border-border px-1.5 py-0.5 rounded-full font-mono">UTC</span>
            <span className="text-[10px] text-ink-faint bg-elevated border border-border px-2 py-0.5 rounded-full">
              {groups.length} run{groups.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-elevated rounded-xl border border-border" />)}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center gap-2 py-3">
          <AlertCircle size={13} className="text-ink-faint shrink-0" />
          <p className="text-[11px] text-ink-muted italic">Données indisponibles</p>
          <button onClick={refetch} className="ml-auto text-[10px] text-ink hover:text-ink-sub transition-colors">Réessayer</button>
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 py-6">
          <Database size={20} className="text-ink-faint" />
          <p className="text-[11px] text-ink-muted text-center">Aucun run dans ExecutionLog</p>
          <p className="text-[10px] text-ink-faint text-center">Données disponibles après la prochaine Query Activity SFMC</p>
        </div>
      )}

      {!isLoading && !isError && groups.length > 0 && (
        <div className="space-y-2">
          {groups.map(({ auto, activities }) => {
            if (!auto) return null
            const sorted = [...activities].sort((a, b) =>
              (a.start_time ? +new Date(a.start_time) : 0) -
              (b.start_time ? +new Date(b.start_time) : 0)
            )
            return (
              <div key={auto.id_log} className="rounded-xl border border-border bg-bg overflow-hidden">
                {/* Automation run row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <RunStatusBadge status={auto.status} />
                  <span className="text-[11px] text-ink-sub font-mono shrink-0">{fmtDate(auto.start_time)}</span>
                  {auto.triggered_by && (
                    <span className="text-[10px] text-ink-faint bg-elevated border border-border px-1.5 py-0.5 rounded-full shrink-0">
                      {auto.triggered_by}
                    </span>
                  )}
                  <span className="flex-1" />
                  <span className="text-[11px] font-mono text-ink-muted shrink-0">{fmtDur(auto.duration_seconds)}</span>
                </div>
                {/* Error message */}
                {auto.error_message && (
                  <div className="mx-3 mb-2 text-[10px] font-mono text-danger bg-danger-bg border border-danger-border px-2 py-1 rounded-lg truncate">
                    {auto.error_message}
                  </div>
                )}
                {/* Activity rows */}
                {sorted.length > 0 && (
                  <div className="border-t border-border divide-y divide-border">
                    {sorted.map(act => (
                      <div key={act.id_log} className="flex items-center gap-2 px-4 py-1.5 bg-elevated">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          act.status === 'success' || act.status === 'complete' ? 'bg-success' :
                          act.status === 'error'   ? 'bg-danger' : 'bg-ink-faint'
                        }`} />
                        <span className="text-[11px] text-ink-sub truncate flex-1">{act.activity_name ?? '—'}</span>
                        {act.activity_type && (
                          <span className="text-[10px] text-ink-faint font-mono shrink-0">{act.activity_type}</span>
                        )}
                        <span className="text-[10px] font-mono text-ink-faint shrink-0">{fmtDur(act.duration_seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── KPI Pill (live SFMC data) ────────────────────────────────────────────────

function KpiPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1.5 bg-bg border border-border rounded-xl p-3 flex-1">
      <div className="flex items-center gap-1.5 text-ink-muted">
        <Icon size={12} />
        <span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <span className="text-[20px] font-bold text-ink leading-none">{value}</span>
    </div>
  )
}

// ─── Activity row with inline SQL ────────────────────────────────────────────

function ActivityRow({ act }: { act: ActivityDetail }) {
  const [contentOpen, setContentOpen] = useState(false)
  const typeLabel  = resolveActivityLabel(act.activityTypeId, act.activityType, act.activityTypeName)
  const isResolved = !typeLabel.startsWith('Type ') && typeLabel !== 'Unknown'
  const qd         = act.queryDetail
  const sd         = act.scriptDetail
  const ad         = act.activityDetail
  const hasContent = !!(qd || sd || ad)
  const hasSQL     = !!qd?.queryText?.trim()
  const hasScript  = !!sd?.script?.trim()
  const btnLabel   = qd ? 'SQL' : sd ? 'Script' : 'Details'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-bg border border-border hover:border-border-strong transition-colors">
        <ChevronRight size={10} className="text-ink-faint flex-shrink-0" />
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0
          ${isResolved ? 'bg-ink text-white border-ink' : 'bg-elevated text-ink-muted border-border'}`}>
          {typeLabel}
        </span>
        <span className="text-[12px] text-ink-sub truncate flex-1">{act.name}</span>
        {act.isActive === false && (
          <span className="text-[10px] text-ink-faint flex-shrink-0">inactive</span>
        )}
        {hasContent && (
          <button
            onClick={() => setContentOpen(v => !v)}
            className="flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink transition-colors flex-shrink-0 ml-1"
          >
            <Database size={10} />
            {btnLabel}
            <ChevronRight size={9} className={`transition-transform ${contentOpen ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {/* SQL Query content */}
      {qd && contentOpen && (
        <div className="ml-4 rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated border-b border-border">
            <Database size={10} className="text-ink-faint flex-shrink-0" />
            <span className="text-[10px] text-ink-muted">Target DE:</span>
            <span className="text-[10px] font-semibold text-ink truncate flex-1">{qd.targetDE ?? '—'}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg border border-border text-ink-faint shrink-0">
              {getUpdateLabel(qd.targetUpdateTypeId)}
            </span>
          </div>
          {hasSQL ? (
            <pre className="text-[10px] font-mono text-ink-sub p-3 overflow-x-auto bg-bg leading-relaxed whitespace-pre max-h-56">
              {qd.queryText!.trim()}
            </pre>
          ) : (
            <p className="text-[10px] text-ink-faint italic px-3 py-2.5 bg-bg">No SQL text returned.</p>
          )}
        </div>
      )}

      {/* Script (SSJS) content */}
      {sd && contentOpen && (
        <div className="ml-4 rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated border-b border-border">
            <Database size={10} className="text-ink-faint flex-shrink-0" />
            <span className="text-[10px] font-semibold text-ink-muted">SSJS Script</span>
            {sd.modifiedDate && (
              <span className="ml-auto text-[9px] text-ink-faint font-mono shrink-0">
                modified {new Date(sd.modifiedDate).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          {hasScript ? (
            <pre className="text-[10px] font-mono text-ink-sub p-3 overflow-x-auto bg-bg leading-relaxed whitespace-pre max-h-56">
              {sd.script!.trim()}
            </pre>
          ) : (
            <p className="text-[10px] text-ink-faint italic px-3 py-2.5 bg-bg">No script content returned.</p>
          )}
        </div>
      )}

      {/* Generic activity detail (Email Send, File Transfer, Import, Data Extract) */}
      {act.activityDetail && contentOpen && (
        <div className="ml-4 rounded-lg border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {act.activityDetail.fields.map(f => (
              <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 bg-bg">
                <span className="text-[10px] text-ink-muted w-28 shrink-0">{f.label}</span>
                <span className="text-[10px] font-mono text-ink-sub truncate">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Steps Timeline ───────────────────────────────────────────────────────────

function StepsTimeline({ steps, isLoading }: { steps: StepDetail[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-elevated flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-elevated rounded w-2/5" />
              <div className="h-8 bg-bg rounded border border-border" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Layers size={28} className="text-ink-faint" />
        <p className="text-[12px] text-ink-muted">No steps in this automation</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {steps.length > 1 && <div className="absolute left-[15px] top-8 bottom-8 w-px bg-border" />}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          return (
            <div key={step.id} className="relative flex gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[12px] font-bold border
                ${isLast ? 'bg-ink text-white border-ink' : 'bg-elevated border-border text-ink-muted'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 pb-2 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[13px] font-semibold text-ink truncate">{step.name}</p>
                  {step.activities.length > 0 && (
                    <span className="text-[10px] text-ink-muted bg-elevated border border-border px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {step.activities.length} {step.activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                  )}
                </div>
                {step.activities.length === 0 ? (
                  <p className="text-[11px] text-ink-faint italic">No activities</p>
                ) : (
                  <div className="space-y-1.5">
                    {step.activities.map(act => <ActivityRow key={act.id} act={act} />)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface AutomationDrawerProps {
  automation: SfmcAutomationEnriched | null
  onClose:    () => void
}

export function AutomationDrawer({ automation, onClose }: AutomationDrawerProps) {
  const { data: activitiesData, isLoading, isError, refetch } =
    useAutomationActivities(automation?.id)

  const { data: kpisResponse, isLoading: kpisLoading } =
    useAutomationKpis(automation?.id)

  // Fetch enough rows to include both automation-level and activity-level rows
  const { data: execData, isLoading: execLoading, isError: execError, refetch: execRefetch } =
    useAutomationExecutions(automation?.id, 100)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isOpen = !!automation
  const data   = automation

  const scheduleObj   = activitiesData?.schedule as any ?? data?.startSource?.schedule ?? data?.schedule
  const scheduleLabel = parseIcal(scheduleObj?.icalRecur) !== '—'
    ? parseIcal(scheduleObj?.icalRecur)
    : scheduleObj?.scheduledTime ? fmtDate(scheduleObj.scheduledTime) : '—'

  const steps           = activitiesData?.steps ?? []
  const totalActivities = steps.reduce((s, st) => s + st.activities.length, 0)

  const allExecItems = execData?.items ?? []

  // Last automation-level run (for the error banner)
  const lastRun = [...allExecItems]
    .filter(r => !r.activity_id)
    .sort((a, b) =>
      (b.start_time ? new Date(b.start_time).getTime() : 0) -
      (a.start_time ? new Date(a.start_time).getTime() : 0)
    )[0]
  const hasError = lastRun?.status === 'error' || lastRun?.status === 'failed'

  // Audit fields — typed via schema
  const createdBy      = extractUserName(data?.createdBy)
  const modifiedBy     = extractUserName(data?.modifiedBy) ?? extractUserName(data?.lastSavedBy)
  const lastPausedBy   = extractUserName(data?.lastPausedBy)
  const lastPausedDate = data?.lastPausedDate ?? data?.pausedDate ?? null
  const lastSavedDate  = data?.lastSavedDate  ?? null

  // Notifications
  const notifEmail     = data?.notifications?.email
  const notifEnabled   = notifEmail?.enabled
  const notifAddresses = notifEmail?.addresses ?? []

  const hkpis      = kpisResponse?.historical_kpis
  const computedAt = kpisResponse?.computed_at
    ? new Date(kpisResponse.computed_at as string).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-surface rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col pointer-events-auto animate-scale-in overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-border flex-shrink-0 bg-surface">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cog size={18} className="text-ink-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-ink leading-tight break-words pr-2">{data?.name ?? '—'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {data && <StatusBadge status={data.mappedStatus} />}
                  <span className="text-[11px] text-ink-muted">
                    {data ? (SFMC_STATUS_LABEL[data.statusId] ?? `Status ${data.statusId}`) : ''}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-elevated transition-colors flex-shrink-0 ml-2">
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">

            {/* Error banner */}
            {hasError && lastRun && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-danger-bg border border-danger-border flex items-start gap-3">
                <XCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-danger">Last run failed</p>
                  {lastRun.error_message && (
                    <p className="text-[11px] mt-0.5 font-mono break-all text-danger-light">
                      {lastRun.error_message}
                    </p>
                  )}
                  <p className="text-[10px] mt-1 text-ink-muted">{fmtDate(lastRun.start_time)}</p>
                </div>
              </div>
            )}

            {/* ── Meta ──────────────────────────────────────────────────── */}
            <div className="px-6 pt-4 pb-4 border-b border-border">
              {/* Pills */}
              <div className="flex gap-2 mb-4">
                <KpiPill icon={Layers}   label="Steps"      value={isLoading ? '…' : steps.length} />
                <KpiPill icon={Activity} label="Activities" value={isLoading ? '…' : totalActivities} />
                <KpiPill icon={Zap}      label="Status ID"  value={data?.statusId ?? '—'} />
              </div>

              <div className="space-y-2">
                {([
                  { icon: Calendar,   label: 'Schedule',       value: scheduleLabel                         },
                  { icon: Clock,      label: 'Last run',        value: fmtDate(data?.lastRunTime)            },
                  { icon: Hash,       label: 'Created',         value: fmtDate(data?.createdDate)            },
                  { icon: User,       label: 'Created by',      value: createdBy                             },
                  { icon: TrendingUp, label: 'Last saved',      value: fmtDate(data?.lastSavedDate ?? data?.modifiedDate) },
                  { icon: User,       label: 'Last saved by',   value: modifiedBy                            },
                  { icon: Pause,      label: 'Last paused',     value: fmtDate(lastPausedDate)               },
                  { icon: Pause,      label: 'Last paused by',  value: lastPausedBy                          },
                  { icon: Power,      label: 'Active',          value: data?.isActive != null ? (data.isActive ? 'Yes' : 'No') : null },
                  { icon: Tag,        label: 'Type',            value: data?.type ?? (data?.typeId ? `Type ${data.typeId}` : null) },
                  { icon: Folder,     label: 'Category',        value: data?.categoryName ?? (data?.categoryId ? `#${data.categoryId}` : null) },
                  { icon: Cog,        label: 'Key',             value: data?.key                             },
                ] as { icon: React.ElementType; label: string; value: string | null | undefined }[])
                  .filter(row => row.value && row.value !== '—')
                  .map(({ icon: Icon, label, value: v }) => (
                    <div key={label} className="flex items-center gap-2 text-[12px]">
                      <Icon size={13} className="text-ink-faint flex-shrink-0" />
                      <span className="text-ink-muted w-32 shrink-0">{label}</span>
                      <span className="text-ink-sub font-mono text-[11px] truncate">{v}</span>
                    </div>
                  ))
                }

                {/* Schedule dates */}
                {(scheduleObj?.startDate || scheduleObj?.endDate) && (
                  <div className="mt-1 ml-5 pl-2 border-l border-border space-y-1">
                    {scheduleObj.startDate && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-ink-faint w-28 shrink-0">Start date</span>
                        <span className="font-mono text-ink-sub">{fmtDate(scheduleObj.startDate)}</span>
                      </div>
                    )}
                    {scheduleObj.endDate && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-ink-faint w-28 shrink-0">End date</span>
                        <span className="font-mono text-ink-sub">{fmtDate(scheduleObj.endDate)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications */}
                {notifEnabled != null && (
                  <div className="flex items-start gap-2 text-[12px] pt-1">
                    <Bell size={13} className="text-ink-faint flex-shrink-0 mt-0.5" />
                    <span className="text-ink-muted w-32 shrink-0">Notifications</span>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-[11px] font-semibold ${notifEnabled ? 'text-success' : 'text-ink-faint'}`}>
                        {notifEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {notifAddresses.map(addr => (
                        <span key={addr} className="flex items-center gap-1 text-[10px] font-mono text-ink-muted">
                          <Mail size={9} className="text-ink-faint" />
                          {addr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── KPIs computed_at banner ───────────────────────────────── */}
            {computedAt && (
              <div className="mx-6 mt-4 flex items-center gap-1.5 text-[10px] text-ink-faint">
                <RefreshCw size={9} />
                <span>KPIs computed {computedAt}</span>
              </div>
            )}

            {/* ── Groupe 1 : Reliability ────────────────────────────────── */}
            <ReliabilitySection data={hkpis?.reliability} isLoading={kpisLoading} />

            {/* ── Groupe 2 : Performance ────────────────────────────────── */}
            <PerformanceSection data={hkpis?.performance} isLoading={kpisLoading} />

            {/* ── Groupe 4 : Health Score / MTBF / MTTR ─────────────────── */}
            <CompositeSection data={hkpis?.composite} isLoading={kpisLoading} />

            {/* ── Email KPIs ────────────────────────────────────────────── */}
            {(kpisLoading || kpisResponse?.email_kpis?.data_available) && (
              <EmailKpiSection
                data={kpisResponse?.email_kpis}
                isLoading={kpisLoading}
                isError={false}
              />
            )}

            {/* ── Groupe 3 : Activity Health ────────────────────────────── */}
            <ActivityHealthSection data={hkpis?.activity} isLoading={kpisLoading} />

            {/* ── Recent Runs (grouped by instance, with activity detail) ── */}
            <RunsSection
              items={allExecItems}
              isLoading={execLoading}
              isError={execError}
              refetch={execRefetch}
            />

            {/* ── Steps & Activities ────────────────────────────────────── */}
            <div className="px-6 py-5">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted mb-4">
                Steps & Activities
              </p>
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-elevated flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-elevated rounded w-2/5" />
                        <div className="h-8 bg-bg rounded border border-border" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-danger">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <p className="text-[12px] font-semibold">Failed to load steps</p>
                  </div>
                  <p className="text-[11px] text-ink-muted font-mono">{(error as Error)?.message ?? 'Unknown error'}</p>
                  <button onClick={() => refetch()}
                    className="flex items-center gap-1.5 text-[11px] text-ink hover:text-ink-sub transition-colors">
                    <RefreshCw size={10} /> Retry
                  </button>
                </div>
              ) : (
                <StepsTimeline steps={steps} isLoading={isLoading} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
