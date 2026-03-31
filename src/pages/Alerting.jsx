import StatusBadge from '../components/StatusBadge'
import { alerts } from '../data/mockData'
import { Mail, MessageSquare, Zap, ArrowUpRight, BellRing, BellOff, CheckCircle2 } from 'lucide-react'

const CHANNEL_ICON = {
  'Slack + Email':  <MessageSquare size={11} className="text-primary-light" />,
  'Email + SMS':    <Mail size={11} className="text-info" />,
  'PagerDuty':      <Zap size={11} className="text-warning" />,
  'Slack':          <MessageSquare size={11} className="text-primary-light" />,
  'Email':          <Mail size={11} className="text-info" />,
}

const STATUS_CONFIG = {
  open:         { icon: BellRing,   color: 'text-danger',  bg: 'bg-danger/10  border-danger/20'  },
  acknowledged: { icon: BellOff,    color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  resolved:     { icon: CheckCircle2, color: 'text-success',bg: 'bg-success/10 border-success/20' },
}

export default function Alerting() {
  const open     = alerts.filter(a => a.status === 'open').length
  const ack      = alerts.filter(a => a.status === 'acknowledged').length
  const resolved = alerts.filter(a => a.status === 'resolved').length

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { v: alerts.length, label: 'Total Alerts',   cls: 'border-white/[0.06]',   tCls: 'text-white' },
          { v: open,          label: 'Open',            cls: 'border-danger/25  bg-danger/[0.06]',   tCls: 'text-danger' },
          { v: ack,           label: 'Acknowledged',   cls: 'border-warning/25 bg-warning/[0.06]',  tCls: 'text-warning' },
          { v: resolved,      label: 'Resolved',       cls: 'border-success/25 bg-success/[0.06]',  tCls: 'text-success' },
        ].map(({ v, label, cls, tCls }) => (
          <div key={label} className={`rounded-2xl p-5 border ${cls} transition-all hover:scale-[1.01] hover:shadow-card-hover`}>
            <p className={`text-3xl font-bold leading-none tracking-tight ${tCls}`}>{v}</p>
            <p className="text-[12px] text-slate-500 mt-2 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert List — card rows */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="section-title">Active Alerts</p>
          <span className="section-sub">{open} require attention</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {alerts.map((a) => {
            const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.open
            const Icon = sc.icon
            const isCritical = a.severity === 'critical'

            return (
              <div key={a.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]
                  ${isCritical ? 'border-l-danger' : a.severity === 'degraded' ? 'border-l-warning' : ''}`}>

                {/* Status Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${sc.bg}`}>
                  <Icon size={15} className={sc.color} />
                </div>

                {/* Title + recipient */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-200 truncate">{a.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{a.recipient}</p>
                </div>

                {/* Channel */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg whitespace-nowrap">
                  {CHANNEL_ICON[a.channel]}
                  {a.channel}
                </div>

                {/* Severity */}
                <div className="w-24 flex justify-center">
                  <StatusBadge status={a.severity} />
                </div>

                {/* Escalated */}
                <div className="w-20 flex justify-center">
                  {a.escalated
                    ? <div className="flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                        <ArrowUpRight size={11} /> Escalated
                      </div>
                    : <span className="text-[11px] text-slate-700">—</span>
                  }
                </div>

                {/* Status badge */}
                <div className="w-24 flex justify-center">
                  <StatusBadge status={a.status} />
                </div>

                {/* Time */}
                <span className="text-[11px] text-slate-600 whitespace-nowrap w-16 text-right">{a.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
