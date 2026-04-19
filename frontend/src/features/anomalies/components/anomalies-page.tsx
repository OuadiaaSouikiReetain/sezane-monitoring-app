import { AlertTriangle, GitBranch, Clock, Flame } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useAnomalies } from '../hooks/use-anomalies'
import { anomalies as mockAnomalies } from '@/mocks/data'
import type { AnomalyType } from '@/entities/anomaly/model'
import type { ElementType } from 'react'

const TYPE_META: Record<AnomalyType, { icon: ElementType; color: string }> = {
  'Automation Delay': { icon: Clock,         color: 'text-warning bg-warning-bg border-warning-border' },
  'Journey Drop':     { icon: GitBranch,     color: 'text-danger  bg-danger-bg  border-danger-border'  },
  'API Timeout':      { icon: AlertTriangle, color: 'text-danger  bg-danger-bg  border-danger-border'  },
  'KPI Anomaly':      { icon: Flame,         color: 'text-warning bg-warning-bg border-warning-border' },
}

export function AnomaliesPage() {
  const { data } = useAnomalies()
  const anomalies = data ?? mockAnomalies

  const critical = anomalies.filter((a) => a.severity === 'critical')
  const degraded = anomalies.filter((a) => a.severity === 'degraded')

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 border border-danger-border bg-danger-bg flex items-center gap-4
          transition-all hover:shadow-card-md shadow-card">
          <div className="w-12 h-12 rounded-xl bg-danger-bg border border-danger-border flex items-center justify-center flex-shrink-0">
            <Flame size={22} className="text-danger" />
          </div>
          <div>
            <p className="text-3xl font-bold text-danger leading-none">{critical.length}</p>
            <p className="text-[12px] text-danger mt-1 font-medium opacity-70">Critical Anomalies</p>
          </div>
        </div>

        <div className="rounded-2xl p-5 border border-warning-border bg-warning-bg flex items-center gap-4
          transition-all hover:shadow-card-md shadow-card">
          <div className="w-12 h-12 rounded-xl bg-warning-bg border border-warning-border flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-warning" />
          </div>
          <div>
            <p className="text-3xl font-bold text-warning leading-none">{degraded.length}</p>
            <p className="text-[12px] text-warning mt-1 font-medium opacity-70">Degraded Anomalies</p>
          </div>
        </div>

        <div className="card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-elevated border border-border flex items-center justify-center flex-shrink-0">
            <Clock size={22} className="text-ink-muted" />
          </div>
          <div>
            <p className="text-3xl font-bold text-ink leading-none">{anomalies.length}</p>
            <p className="text-[12px] text-ink-muted mt-1 font-medium">Total Active</p>
          </div>
        </div>
      </div>

      {/* Anomaly Feed */}
      <div className="space-y-3">
        {anomalies.map((a) => {
          const meta = TYPE_META[a.type] ?? { icon: AlertTriangle, color: 'text-ink-muted bg-elevated border-border' }
          const Icon = meta.icon
          const isCritical = a.severity === 'critical'

          return (
            <div
              key={a.id}
              className={`group card rounded-2xl p-5 transition-all duration-200
                hover:bg-elevated hover:shadow-card-md
                ${isCritical ? 'border-l-danger' : 'border-l-warning'}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    isCritical
                      ? 'bg-danger-bg border-danger-border text-danger'
                      : 'bg-warning-bg border-warning-border text-warning'
                  }`}
                >
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-ink">{a.type}</span>
                    <StatusBadge status={a.severity} />
                    <span className="text-[11px] text-ink-faint ml-auto">{a.time}</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mb-3 leading-relaxed">{a.description}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        isCritical
                          ? 'bg-danger-bg border-danger-border text-danger'
                          : 'bg-warning-bg border-warning-border text-warning'
                      }`}
                    >
                      <AlertTriangle size={10} />
                      {a.impact}
                    </div>
                    {a.journey && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-sub bg-elevated border border-border px-2.5 py-1 rounded-lg">
                        <GitBranch size={10} />
                        {a.journey}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
