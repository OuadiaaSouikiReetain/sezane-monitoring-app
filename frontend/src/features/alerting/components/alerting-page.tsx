import { Mail, MessageSquare, Zap, ArrowUpRight, BellRing, BellOff, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useAlerts } from '../hooks/use-alerting'
import { alerts as mockAlerts } from '@/mocks/data'
import type { AlertChannel } from '@/entities/alert/model'
import type { ReactNode } from 'react'

const CHANNEL_ICON: Record<AlertChannel, ReactNode> = {
  'Slack + Email': <MessageSquare size={11} className="text-ink-muted" />,
  'Email + SMS':   <Mail size={11} className="text-ink-muted" />,
  'PagerDuty':     <Zap size={11} className="text-warning" />,
  'Slack':         <MessageSquare size={11} className="text-ink-muted" />,
  'Email':         <Mail size={11} className="text-ink-muted" />,
}

const STATUS_CONFIG = {
  open:         { icon: BellRing,     color: 'text-danger',  bg: 'bg-danger-bg  border-danger-border'  },
  acknowledged: { icon: BellOff,      color: 'text-warning', bg: 'bg-warning-bg border-warning-border' },
  resolved:     { icon: CheckCircle2, color: 'text-success', bg: 'bg-success-bg border-success-border' },
}

export function AlertingPage() {
  const { data } = useAlerts()
  const alerts = data ?? mockAlerts

  const open     = alerts.filter((a) => a.status === 'open').length
  const ack      = alerts.filter((a) => a.status === 'acknowledged').length
  const resolved = alerts.filter((a) => a.status === 'resolved').length

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { v: alerts.length, label: 'Total Alerts',  cls: 'border-border',                               tCls: 'text-ink'     },
          { v: open,          label: 'Open',           cls: 'border-danger-border  bg-danger-bg',          tCls: 'text-danger'  },
          { v: ack,           label: 'Acknowledged',  cls: 'border-warning-border bg-warning-bg',         tCls: 'text-warning' },
          { v: resolved,      label: 'Resolved',      cls: 'border-success-border bg-success-bg',         tCls: 'text-success' },
        ].map(({ v, label, cls, tCls }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 border bg-surface shadow-card ${cls} transition-all hover:scale-[1.01] hover:shadow-card-md`}
          >
            <p className={`text-3xl font-bold leading-none tracking-tight ${tCls}`}>{v}</p>
            <p className="text-[12px] text-ink-muted mt-2 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="section-title">Active Alerts</p>
          <span className="section-sub">{open} require attention</span>
        </div>
        <div className="divide-y divide-border-light">
          {alerts.map((a) => {
            const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.open
            const Icon = sc.icon
            const isCritical = a.severity === 'critical'

            return (
              <div
                key={a.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated
                  ${isCritical ? 'border-l-danger' : a.severity === 'degraded' ? 'border-l-warning' : ''}`}
              >
                {/* Status Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${sc.bg}`}>
                  <Icon size={15} className={sc.color} />
                </div>

                {/* Title + recipient */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{a.title}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5 truncate">{a.recipient}</p>
                </div>

                {/* Channel */}
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-elevated border border-border px-2.5 py-1 rounded-lg whitespace-nowrap">
                  {CHANNEL_ICON[a.channel]}
                  {a.channel}
                </div>

                {/* Severity */}
                <div className="w-24 flex justify-center">
                  <StatusBadge status={a.severity} />
                </div>

                {/* Escalated */}
                <div className="w-20 flex justify-center">
                  {a.escalated ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning-bg border border-warning-border px-2 py-0.5 rounded-full">
                      <ArrowUpRight size={11} /> Escalated
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-faint">—</span>
                  )}
                </div>

                {/* Status badge */}
                <div className="w-24 flex justify-center">
                  <StatusBadge status={a.status} />
                </div>

                {/* Time */}
                <span className="text-[11px] text-ink-faint whitespace-nowrap w-16 text-right">
                  {a.time}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
