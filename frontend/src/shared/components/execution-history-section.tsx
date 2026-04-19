/**
 * ExecutionHistorySection
 * ───────────────────────
 * Affiche les derniers runs (ExecutionLog DE) dans un drawer.
 * Utilisé dans AutomationDrawer et JourneyDrawer.
 */

import { Clock, CheckCircle, XCircle, Loader2, AlertCircle, Minus, Database } from 'lucide-react'
import type { ExecutionLogRow } from '@/features/automations/hooks/use-automation-executions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

function fmtDuration(sec?: number | null): string {
  if (sec == null) return '—'
  if (sec < 60)   return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string
  icon:  React.ElementType
  cls:   string
}> = {
  // ── Success variants ────────────────────────────────────────────────────────
  success:   { label: 'Success',   icon: CheckCircle,  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  complete:  { label: 'Complete',  icon: CheckCircle,  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  completed: { label: 'Complete',  icon: CheckCircle,  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  // ── Error / issue variants ───────────────────────────────────────────────────
  error:     { label: 'Error',     icon: XCircle,      cls: 'text-red-700     bg-red-50     border-red-200'     },
  failed:    { label: 'Failed',    icon: XCircle,      cls: 'text-red-700     bg-red-50     border-red-200'     },
  // ── In-progress / neutral ────────────────────────────────────────────────────
  running:   { label: 'Running',   icon: Loader2,      cls: 'text-ink-sub    bg-elevated    border-border'      },
  paused:    { label: 'Paused',    icon: Minus,        cls: 'text-amber-700  bg-amber-50   border-amber-200'   },
  skipped:   { label: 'Skipped',   icon: Minus,        cls: 'text-ink-muted  bg-elevated   border-border'      },
  cancelled: { label: 'Cancelled', icon: Minus,        cls: 'text-ink-muted  bg-elevated   border-border'      },
  // ── Journey-specific ─────────────────────────────────────────────────────────
  entry:     { label: 'Entry',     icon: CheckCircle,  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  exit:      { label: 'Exit',      icon: Minus,        cls: 'text-ink-muted  bg-elevated   border-border'      },
  goal_met:  { label: 'Goal Met',  icon: CheckCircle,  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200'},
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status ?? 'Unknown',
    icon:  Minus,
    cls:   'text-ink-muted bg-elevated border-border',
  }
  const Icon = cfg.icon
  return (
    <span className={`
      inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5
      rounded border flex-shrink-0 ${cfg.cls}
    `}>
      <Icon size={9} className={status === 'running' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ExecutionHistorySectionProps {
  items:     ExecutionLogRow[]
  isLoading: boolean
  isError:   boolean
  refetch:   () => void
}

export function ExecutionHistorySection({
  items, isLoading, isError, refetch,
}: ExecutionHistorySectionProps) {
  // Sort by start_time DESC — the DE query has no ORDER BY guarantee
  const sorted = [...items].sort((a, b) => {
    const ta = a.start_time ? new Date(a.start_time).getTime() : 0
    const tb = b.start_time ? new Date(b.start_time).getTime() : 0
    return tb - ta
  })

  return (
    <div className="px-6 py-5 border-b border-border">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted flex items-center gap-1.5">
          <Clock size={11} />
          Recent Runs
        </p>
        {!isLoading && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-ink-faint bg-elevated border border-border px-1.5 py-0.5 rounded-full font-mono">UTC</span>
            <span className="text-[10px] text-ink-faint bg-elevated border border-border px-2 py-0.5 rounded-full">
              {items.length} enregistrés
            </span>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className="h-4 bg-elevated rounded w-16 shrink-0" />
              <div className="flex-1 h-3 bg-border rounded" />
              <div className="h-3 bg-elevated rounded w-12 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div className="flex items-center gap-2 py-3">
          <AlertCircle size={13} className="text-ink-faint shrink-0" />
          <p className="text-[11px] text-ink-muted italic">Données indisponibles</p>
          <button
            onClick={refetch}
            className="ml-auto text-[10px] text-ink hover:text-ink-sub transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Rows (empty or with data) */}
      <div className="space-y-1.5">
        {sorted.map((row) => (
          <div
            key={row.id_log}
            className="flex items-center gap-2 p-2 rounded-lg bg-bg border border-border hover:border-border-strong transition-colors"
          >
            <StatusBadge status={row.status} />

            <span className="text-[11px] text-ink-sub font-mono shrink-0">
              {fmtDate(row.start_time)}
            </span>

            <span className="flex-1 text-[11px] text-ink-muted truncate min-w-0">
              {row.activity_name ?? row.triggered_by ?? '—'}
            </span>

            <span className="text-[11px] text-ink-muted font-mono shrink-0">
              {fmtDuration(row.duration_seconds)}
            </span>
          </div>
        ))}

        {/* Empty state message only when list is truly empty */}
        {!isLoading && !isError && sorted.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 py-4 text-center">
            <p className="text-[10px] text-ink-faint italic">
              Pas de données d'exécution disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
