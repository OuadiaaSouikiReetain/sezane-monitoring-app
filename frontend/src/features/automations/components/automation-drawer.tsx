import { useEffect } from 'react'
import {
  X, Cog, Calendar, Clock, Layers, Activity,
  AlertCircle, ChevronRight, Zap, RefreshCw, CheckCircle,
  XCircle, Minus, Loader2, AlertTriangle,
} from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useSfmcAutomationDetails } from '../hooks/use-sfmc-automations'
import { useAutomationKpis } from '../hooks/use-automation-kpis'
import { useAutomationExecutions } from '../hooks/use-automation-executions'
import { EmailKpiSection } from '@/shared/components/email-kpi-section'
import { ExecutionHistorySection } from '@/shared/components/execution-history-section'
import {
  resolveActivityLabel,
  SFMC_STATUS_LABEL,
  type SfmcAutomationEnriched,
  type SfmcStep,
} from '../types/automation.types'

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

// ─── Steps Timeline ───────────────────────────────────────────────────────────

function StepsTimeline({ steps }: { steps: SfmcStep[] }) {
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
          const isLast  = idx === steps.length - 1
          const stepNum = idx + 1
          return (
            <div key={step.id} className="relative flex gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[12px] font-bold border
                ${isLast ? 'bg-ink text-white border-ink' : 'bg-elevated border-border text-ink-muted'}`}>
                {stepNum}
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
                    {step.activities.map((act) => {
                      const typeLabel  = resolveActivityLabel(act.activityTypeId, act.activityType, act.activityTypeName)
                      const isResolved = !typeLabel.startsWith('Type ') && typeLabel !== 'Unknown'
                      return (
                        <div key={act.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-bg border border-border hover:border-border-strong transition-colors">
                          <ChevronRight size={10} className="text-ink-faint flex-shrink-0" />
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0
                            ${isResolved ? 'bg-ink text-white border-ink' : 'bg-elevated text-ink-muted border-border'}`}>
                            {typeLabel}
                          </span>
                          <span className="text-[12px] text-ink-sub truncate">{act.name}</span>
                          {act.isActive === false && (
                            <span className="ml-auto text-[10px] text-ink-faint flex-shrink-0">inactive</span>
                          )}
                        </div>
                      )
                    })}
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

// ─── Modal ────────────────────────────────────────────────────────────────────

interface AutomationDrawerProps {
  automation: SfmcAutomationEnriched | null
  onClose:    () => void
}

export function AutomationDrawer({ automation, onClose }: AutomationDrawerProps) {
  const { automation: detail, isLoading, isError, error, refetch } = useSfmcAutomationDetails(automation?.id ?? '')
  const { data: kpisResponse, isLoading: kpisLoading, isError: kpisError } = useAutomationKpis(automation?.id)
  const { data: execData, isLoading: execLoading, isError: execError, refetch: execRefetch } = useAutomationExecutions(automation?.id)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isOpen = !!automation
  const data   = detail ? { ...automation, ...detail } : automation
  const schedule      = data?.startSource?.schedule
  const scheduleLabel = parseIcal(schedule?.icalRecur) !== '—'
    ? parseIcal(schedule?.icalRecur)
    : schedule?.scheduledTime ? fmtDate(schedule.scheduledTime) : '—'
  const steps           = detail?.steps ?? []
  const totalActivities = steps.reduce((s, st) => s + st.activities.length, 0)

  // Last run error banner
  const lastRun    = execData?.items?.[0]
  const hasError   = lastRun?.status === 'error'

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

            {/* KPI Pills */}
            <div className="px-6 pt-4 pb-4 border-b border-border">
              <div className="flex gap-2 mb-4">
                <KpiPill icon={Layers}   label="Steps"      value={isLoading ? '…' : steps.length} />
                <KpiPill icon={Activity} label="Activities" value={isLoading ? '…' : totalActivities} />
                <KpiPill icon={Zap}      label="Status ID"  value={data?.statusId ?? '—'} />
              </div>
              {/* Meta */}
              <div className="space-y-2">
                {[
                  { icon: Calendar, label: 'Schedule', value: scheduleLabel },
                  { icon: Clock,    label: 'Last run',  value: fmtDate(data?.lastRunTime) },
                  { icon: Clock,    label: 'Modified',  value: fmtDate(data?.modifiedDate) },
                  { icon: Clock,    label: 'Created',   value: fmtDate(data?.createdDate) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2 text-[12px]">
                    <Icon size={13} className="text-ink-faint flex-shrink-0" />
                    <span className="text-ink-muted w-24 shrink-0">{label}</span>
                    <span className="text-ink-sub font-mono text-[11px] truncate">{value}</span>
                  </div>
                ))}
                {data?.key && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <Cog size={13} className="text-ink-faint flex-shrink-0" />
                    <span className="text-ink-muted w-24 shrink-0">Key</span>
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

            {/* Steps & Activities */}
            <div className="px-6 py-5">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted mb-4">Steps & Activities</p>
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {[1,2,3].map((i) => (
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
                    <AlertCircle size={14} className="text-danger flex-shrink-0" />
                    <p className="text-[12px] font-semibold text-danger">Failed to load steps</p>
                  </div>
                  <p className="text-[11px] text-ink-muted font-mono">{(error as Error)?.message ?? 'Unknown error'}</p>
                  <button onClick={() => refetch()}
                    className="flex items-center gap-1.5 text-[11px] text-ink hover:text-ink-sub transition-colors">
                    <RefreshCw size={10} /> Retry
                  </button>
                </div>
              ) : (
                <StepsTimeline steps={steps} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
