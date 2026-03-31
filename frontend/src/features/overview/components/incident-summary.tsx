import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { StatusBadge } from '@/shared/components/ui'
import type { Anomaly } from '@/entities/anomaly/model'

interface IncidentSummaryProps {
  anomalies: Anomaly[]
}

export function IncidentSummary({ anomalies }: IncidentSummaryProps) {
  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="section-title">Recent Anomalies</p>
          <p className="section-sub mt-0.5">{criticalCount} critical</p>
        </div>
        <Link
          to="/anomalies"
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-light transition-colors"
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>
      <div className="space-y-2">
        {anomalies.slice(0, 4).map((a) => (
          <div
            key={a.id}
            className={`flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]
              transition-colors hover:bg-white/[0.04] cursor-default
              ${a.severity === 'critical' ? 'border-l-danger' : 'border-l-warning'}`}
          >
            <StatusBadge status={a.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-200 truncate">{a.type}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{a.description}</p>
            </div>
            <span className="text-[10px] text-slate-600 whitespace-nowrap pt-0.5">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
