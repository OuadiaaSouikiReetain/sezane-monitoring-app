import { useEffect } from 'react'
import {
  X, Cog, Calendar, Clock, Layers, Activity,
  Loader2, AlertCircle, ChevronRight, Zap, RefreshCw,
} from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useSfmcAutomationDetails } from '../hooks/use-sfmc-automations'
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
  const days: Record<string, string> = {
    MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun',
  }
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiPill({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex-1">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Icon size={12} />
        <span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <span className="text-[18px] font-bold text-white leading-none">{value}</span>
    </div>
  )
}

function StepsTimeline({ steps }: { steps: SfmcStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Layers size={28} className="text-slate-700" />
        <p className="text-[12px] text-slate-600">No steps in this automation</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {steps.length > 1 && (
        <div className="absolute left-[15px] top-8 bottom-8 w-px bg-white/[0.06]" />
      )}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isLast   = idx === steps.length - 1
          const stepNum  = idx + 1  // stepNumber from API is unreliable, use index

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Step number bubble */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10
                text-[12px] font-bold border
                ${isLast
                  ? 'bg-primary/20 border-primary/40 text-primary-light'
                  : 'bg-white/[0.05] border-white/[0.1] text-slate-400'}
              `}>
                {stepNum}
              </div>

              <div className="flex-1 pb-2 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[13px] font-semibold text-slate-200 truncate">{step.name}</p>
                  {step.activities.length > 0 && (
                    <span className="text-[10px] text-slate-600 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {step.activities.length} {step.activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                  )}
                </div>

                {step.activities.length === 0 ? (
                  <p className="text-[11px] text-slate-700 italic">No activities</p>
                ) : (
                  <div className="space-y-1.5">
                    {step.activities.map((act) => {
                      const typeLabel = resolveActivityLabel(
                        act.activityTypeId,
                        act.activityType,
                        act.activityTypeName,
                      )
                      const isResolved = !typeLabel.startsWith('Type ') && typeLabel !== 'Unknown'

                      return (
                        <div
                          key={act.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-primary/20 transition-colors"
                        >
                          <ChevronRight size={10} className="text-slate-700 flex-shrink-0" />
                          <span className={`
                            text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0
                            ${isResolved
                              ? 'bg-primary/10 text-primary-light border-primary/20'
                              : 'bg-white/[0.04] text-slate-500 border-white/[0.08]'}
                          `}>
                            {typeLabel}
                          </span>
                          <span className="text-[12px] text-slate-300 truncate">{act.name}</span>
                          {act.isActive === false && (
                            <span className="ml-auto text-[10px] text-slate-600 flex-shrink-0">inactive</span>
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

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface AutomationDrawerProps {
  automation: SfmcAutomationEnriched | null
  onClose:    () => void
}

export function AutomationDrawer({ automation, onClose }: AutomationDrawerProps) {
  const {
    automation: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useSfmcAutomationDetails(automation?.id ?? '')

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isOpen   = !!automation
  const data     = detail ?? automation
  const schedule = data?.startSource?.schedule
  const scheduleLabel = parseIcal(schedule?.icalRecur) !== '—'
    ? parseIcal(schedule?.icalRecur)
    : schedule?.scheduledTime ? fmtDate(schedule.scheduledTime) : '—'

  const steps           = detail?.steps ?? []
  const totalActivities = steps.reduce((s, st) => s + st.activities.length, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-[480px] z-50
        bg-[#0F1724] border-l border-white/[0.08] shadow-2xl
        flex flex-col transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cog size={16} className="text-primary-light" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-white leading-tight break-words pr-2">
                {data?.name ?? '—'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {data && <StatusBadge status={data.mappedStatus} />}
                <span className="text-[11px] text-slate-500">
                  {data ? (SFMC_STATUS_LABEL[data.statusId] ?? `Status ${data.statusId}`) : ''}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors flex-shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* KPI pills */}
          <div className="p-5 border-b border-white/[0.06]">
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
                  <Icon size={13} className="text-slate-600 flex-shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">{label}</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate">{value}</span>
                </div>
              ))}
              {data?.key && (
                <div className="flex items-center gap-2 text-[12px]">
                  <Cog size={13} className="text-slate-600 flex-shrink-0" />
                  <span className="text-slate-500 w-24 shrink-0">Key</span>
                  <span className="text-slate-400 font-mono text-[11px] truncate">{data.key}</span>
                </div>
              )}
            </div>
          </div>

          {/* Steps section */}
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-4">
              Steps & Activities
            </p>

            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-white/[0.05] rounded w-2/5" />
                      <div className="h-8 bg-white/[0.03] rounded" />
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
                <p className="text-[11px] text-slate-600 font-mono leading-relaxed break-all">
                  {(error as Error)?.message ?? 'Unknown error'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-light transition-colors"
                >
                  <RefreshCw size={10} /> Retry
                </button>
              </div>
            ) : (
              <StepsTimeline steps={steps} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
