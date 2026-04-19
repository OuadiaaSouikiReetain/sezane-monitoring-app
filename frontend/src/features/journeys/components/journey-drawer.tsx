import { useEffect } from 'react'
import {
  X, GitBranch, Calendar, Users, Target, Activity,
  Loader2, AlertCircle, RefreshCw, CheckCircle, TrendingUp,
  XCircle, ChevronRight,
} from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { sfmcJourneysApi } from '../api/sfmc-journeys.api'
import { useQuery } from '@tanstack/react-query'
import type { SfmcJourneyEnriched } from '../types/sfmc-journey.types'
import { SFMC_JOURNEY_TYPE_LABEL } from '../types/sfmc-journey.types'
import { z } from 'zod'
import { SfmcJourneySchema } from '../types/sfmc-journey.types'
import { EmailKpiSection } from '@/shared/components/email-kpi-section'
import { ExecutionHistorySection } from '@/shared/components/execution-history-section'
import { useJourneyKpis } from '../hooks/use-journey-kpis'
import { useJourneyExecutions } from '../hooks/use-journey-executions'

// ─── Schema ───────────────────────────────────────────────────────────────────

const ActivitySchema = z.object({
  id:       z.string().optional(),
  name:     z.string().optional(),
  type:     z.string().optional(),
  outcomes: z.array(z.unknown()).optional(),
}).passthrough()

const JourneyDetailSchema = SfmcJourneySchema.extend({
  activities: z.array(ActivitySchema).optional().default([]),
}).passthrough()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number | null): string {
  if (n === undefined || n === null) return '—'
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n)
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

function fmtPct(n?: number | null): string {
  if (n === undefined || n === null) return '—'
  return `${n.toFixed(1)}%`
}

// ─── Activity type labels ─────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  EMAILV2:               'Email Send',
  EMAIL:                 'Email Send',
  SMSSYNC:               'SMS',
  PUSH:                  'Push',
  WAIT:                  'Wait',
  MULTICRITERIADECISION: 'Decision Split',
  RANDOMSPLIT:           'Random Split',
  ENGAGEMENTSPLIT:       'Engagement Split',
  UPDATECONTACT:         'Update Contact',
  CONTACTDATAFIREEVENTSOURCE: 'Fire Event',
  EINSTEIN:              'Einstein',
}

// Activity type colors
const ACTIVITY_COLOR: Record<string, string> = {
  'Email Send':    'bg-ink text-white border-ink',
  'SMS':           'bg-info-bg text-info border-info-border',
  'Wait':          'bg-elevated text-ink-muted border-border',
  'Decision Split':'bg-warning-bg text-warning border-warning-border',
  'Random Split':  'bg-warning-bg text-warning border-warning-border',
}

// ─── KPI Pill ─────────────────────────────────────────────────────────────────

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

// ─── Activity List ────────────────────────────────────────────────────────────

function ActivityList({ activities }: { activities: Array<{ id?: string; name?: string; type?: string }> }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Activity size={28} className="text-ink-faint" />
        <p className="text-[12px] text-ink-muted">No activities</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {activities.map((act, idx) => {
        const typeLabel = ACTIVITY_TYPE_LABEL[act.type ?? ''] ?? act.type ?? 'Unknown'
        const colorCls  = ACTIVITY_COLOR[typeLabel] ?? 'bg-elevated text-ink-muted border-border'
        return (
          <div key={act.id ?? idx}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg border border-border hover:border-border-strong hover:shadow-card transition-all">
            <div className="w-6 h-6 rounded-full bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-ink-muted">{idx + 1}</span>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg border flex-shrink-0 ${colorCls}`}>
              {typeLabel}
            </span>
            <span className="text-[12px] text-ink-sub truncate">{act.name ?? '—'}</span>
            <ChevronRight size={12} className="text-ink-faint ml-auto flex-shrink-0" />
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface JourneyDrawerProps {
  journey: SfmcJourneyEnriched | null
  onClose: () => void
}

export function JourneyDrawer({ journey, onClose }: JourneyDrawerProps) {
  const { data: raw, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['sfmc-journey-detail', journey?.id],
    queryFn:  () => sfmcJourneysApi.getJourneyDetails(journey!.id),
    enabled:  !!journey?.id,
  })

  const { data: kpisResponse, isLoading: kpisLoading, isError: kpisError } = useJourneyKpis(journey?.id)
  const { data: execData, isLoading: execLoading, isError: execError, refetch: execRefetch } = useJourneyExecutions(journey?.id)

  const detail     = raw ? JourneyDetailSchema.safeParse(raw) : null
  const activities = detail?.success ? (detail.data.activities ?? []) : (journey?.activities ?? [])
  const data       = raw ? { ...journey, ...raw } : journey
  const stats      = data?.stats

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isOpen    = !!journey
  const typeLabel = SFMC_JOURNEY_TYPE_LABEL[journey?.definitionType ?? ''] ?? journey?.definitionType ?? '—'

  // Last error from execution log
  const errorRun = execData?.items?.find(r => r.status === 'error')

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
          <div className="flex items-start justify-between px-6 py-5 border-b border-border flex-shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <GitBranch size={18} className="text-ink-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-ink leading-tight break-words pr-2">{journey?.name ?? '—'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {journey && <StatusBadge status={journey.mappedStatus} />}
                  <span className="text-[11px] text-ink-muted">{journey?.status}</span>
                  <span className="text-[11px] text-ink-faint">· {typeLabel}</span>
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
            {errorRun && (
              <div className="mx-6 mt-4 p-3 rounded-xl border flex items-start gap-3"
                style={{ background: '#FDEDEF', borderColor: '#F5A3A9' }}>
                <XCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-danger">
                    Journey error detected
                  </p>
                  {errorRun.error_message && (
                    <p className="text-[11px] mt-0.5 font-mono break-all text-danger-light">
                      {errorRun.error_message}
                    </p>
                  )}
                  {errorRun.activity_name && (
                    <p className="text-[11px] mt-1 text-ink-muted">
                      Activity: <span className="font-semibold text-ink-sub">{errorRun.activity_name}</span>
                      {errorRun.activity_type && <span className="ml-1 text-ink-faint">({errorRun.activity_type})</span>}
                    </p>
                  )}
                  <p className="text-[10px] mt-1 text-ink-muted">{fmtDate(errorRun.start_time)}</p>
                </div>
              </div>
            )}

            {/* KPI pills */}
            <div className="px-6 pt-4 pb-4 border-b border-border">
              <div className="flex gap-2 mb-4">
                <KpiPill icon={Users}      label="In Journey" value={fmt(stats?.currentPopulation)} />
                <KpiPill icon={TrendingUp} label="Total"      value={fmt(stats?.cumulativePopulation)} />
                <KpiPill icon={Target}     label="Goal"       value={fmtPct(stats?.metGoal)} />
              </div>
              {/* Meta */}
              <div className="space-y-2">
                {[
                  { icon: Calendar,     label: 'Last published', value: fmtDate(data?.lastPublishedDate) },
                  { icon: Calendar,     label: 'Created',        value: fmtDate(data?.createdDate) },
                  { icon: Calendar,     label: 'Modified',       value: fmtDate(data?.modifiedDate) },
                  { icon: CheckCircle,  label: 'Version',        value: data?.version ?? '—' },
                  { icon: Activity,     label: 'Activities',     value: isLoading ? '…' : activities.length },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2 text-[12px]">
                    <Icon size={13} className="text-ink-faint flex-shrink-0" />
                    <span className="text-ink-muted w-28 shrink-0">{label}</span>
                    <span className="text-ink-sub font-mono text-[11px]">{value}</span>
                  </div>
                ))}
                {data?.key && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <GitBranch size={13} className="text-ink-faint flex-shrink-0" />
                    <span className="text-ink-muted w-28 shrink-0">Key</span>
                    <span className="text-ink-sub font-mono text-[11px] truncate">{data.key}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email KPIs */}
            <EmailKpiSection data={kpisResponse?.email_kpis} isLoading={kpisLoading} isError={kpisError} />

            {/* Recent Runs */}
            <ExecutionHistorySection
              items={execData?.items ?? []}
              isLoading={execLoading}
              isError={execError}
              refetch={execRefetch}
            />

            {/* Activities */}
            <div className="px-6 py-5">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted mb-4">Activities</p>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 size={16} className="animate-spin text-ink-muted" />
                  <p className="text-[12px] text-ink-muted">Loading activities…</p>
                </div>
              ) : isError ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-danger">
                    <AlertCircle size={14} className="text-danger" />
                    <p className="text-[12px] font-semibold text-danger">Failed to load activities</p>
                  </div>
                  <p className="text-[11px] text-ink-muted font-mono">{(error as Error)?.message ?? 'Unknown error'}</p>
                  <button onClick={() => refetch()}
                    className="flex items-center gap-1.5 text-[11px] text-ink hover:text-ink-sub transition-colors">
                    <RefreshCw size={10} /> Retry
                  </button>
                </div>
              ) : (
                <ActivityList activities={activities} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
