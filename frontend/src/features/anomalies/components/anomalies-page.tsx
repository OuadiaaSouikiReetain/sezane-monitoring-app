import { AlertTriangle, GitBranch, Clock, Flame } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useAnomalies } from '../hooks/use-anomalies'
import { anomalies as mockAnomalies } from '@/mocks/data'
import type { AnomalyType } from '@/entities/anomaly/model'
import type { ElementType } from 'react'

const TYPE_META: Record<AnomalyType, { icon: ElementType; color: string }> = {
  'Automation Delay': { icon: Clock,         color: 'text-warning bg-warning/10' },
  'Journey Drop':     { icon: GitBranch,     color: 'text-danger  bg-danger/10'  },
  'API Timeout':      { icon: AlertTriangle, color: 'text-danger  bg-danger/10'  },
  'KPI Anomaly':      { icon: Flame,         color: 'text-warning bg-warning/10' },
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
        <div className="rounded-2xl p-5 border border-danger/25 bg-danger/[0.06] flex items-center gap-4
          transition-all hover:border-danger/40 hover:bg-danger/[0.09]">
          <div className="w-12 h-12 rounded-xl bg-danger/15 border border-danger/25 flex items-center justify-center flex-shrink-0">
            <Flame size={22} className="text-danger" />
          </div>
          <div>
            <p className="text-3xl font-bold text-danger leading-none">{critical.length}</p>
            <p className="text-[12px] text-danger/70 mt-1 font-medium">Critical Anomalies</p>
          </div>
        </div>

        <div className="rounded-2xl p-5 border border-warning/25 bg-warning/[0.06] flex items-center gap-4
          transition-all hover:border-warning/40 hover:bg-warning/[0.09]">
          <div className="w-12 h-12 rounded-xl bg-warning/15 border border-warning/25 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-warning" />
          </div>
          <div>
            <p className="text-3xl font-bold text-warning leading-none">{degraded.length}</p>
            <p className="text-[12px] text-warning/70 mt-1 font-medium">Degraded Anomalies</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Clock size={22} className="text-primary-light" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-none">{anomalies.length}</p>
            <p className="text-[12px] text-slate-500 mt-1 font-medium">Total Active</p>
          </div>
        </div>
      </div>

      {/* Anomaly Feed */}
      <div className="space-y-3">
        {anomalies.map((a) => {
          const meta = TYPE_META[a.type] ?? { icon: AlertTriangle, color: 'text-slate-400 bg-white/[0.06]' }
          const Icon = meta.icon
          const isCritical = a.severity === 'critical'

          return (
            <div
              key={a.id}
              className={`group card rounded-2xl p-5 transition-all duration-200
                hover:bg-elevated hover:border-white/[0.1]
                ${isCritical ? 'border-l-danger' : 'border-l-warning'}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    isCritical
                      ? 'bg-danger/10 border-danger/20 text-danger'
                      : 'bg-warning/10 border-warning/20 text-warning'
                  }`}
                >
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-white">{a.type}</span>
                    <StatusBadge status={a.severity} />
                    <span className="text-[11px] text-slate-600 ml-auto">{a.time}</span>
                  </div>
                  <p className="text-[13px] text-slate-400 mb-3 leading-relaxed">{a.description}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        isCritical
                          ? 'bg-danger/[0.08] border-danger/20 text-danger/80'
                          : 'bg-warning/[0.08] border-warning/20 text-warning/80'
                      }`}
                    >
                      <AlertTriangle size={10} />
                      {a.impact}
                    </div>
                    {a.journey && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-info bg-info/10 border border-info/20 px-2.5 py-1 rounded-lg">
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
