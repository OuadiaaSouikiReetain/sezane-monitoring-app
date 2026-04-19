import { Clock, AlertTriangle, CheckCircle, Play } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useAutomations } from '../hooks/use-automations'
import { automations as mockAutomations } from '@/mocks/data'

export function AutomationsPage() {
  const { data: queryResult } = useAutomations()
  const automations = queryResult?.results ?? mockAutomations

  const totalOk    = automations.filter((a) => a.status === 'healthy').length
  const withDelay  = automations.filter((a) => a.delay).length
  const critical   = automations.filter((a) => a.status === 'critical').length

  const stats = [
    { v: automations.length, label: 'Total Jobs',  icon: Play,          cls: 'text-primary bg-primary-bg border-primary-border' },
    { v: totalOk,            label: 'Running OK',  icon: CheckCircle,   cls: 'text-success bg-success-bg border-success-border' },
    { v: withDelay,          label: 'With Delays', icon: Clock,         cls: 'text-warning bg-warning-bg border-warning-border' },
    { v: critical,           label: 'Critical',    icon: AlertTriangle, cls: 'text-danger bg-danger-bg border-danger-border' },
  ]

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ v, label, icon: Icon, cls }) => (
          <div key={label} className="card-hover rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cls}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink leading-none">{v}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="section-title">Automation Jobs</p>
          <span className="section-sub">{automations.length} jobs monitored</span>
        </div>
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Name', 'Frequency', 'Last Run', 'Duration', 'Status', 'Delay'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {automations.map((a) => (
                <tr
                  key={a.id}
                  className={a.delay ? 'border-l-warning' : a.status === 'critical' ? 'border-l-danger' : ''}
                >
                  <td>
                    <span className="font-semibold text-ink">{a.name}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-elevated border border-border px-2 py-1 rounded-lg w-fit">
                      <Clock size={11} className="text-ink-faint" />
                      {a.frequency}
                    </div>
                  </td>
                  <td>
                    <span className="text-[12px] text-ink-muted">{a.lastRun}</span>
                  </td>
                  <td>
                    <span className="font-mono text-[12px] text-ink-sub tabular-nums">{a.duration}</span>
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    {a.delay ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-warning bg-warning-bg border border-warning-border px-2 py-0.5 rounded-full w-fit">
                        <AlertTriangle size={11} />
                        Detected
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-faint">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
