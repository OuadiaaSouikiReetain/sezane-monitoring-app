import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, AlertTriangle, GitBranch } from 'lucide-react'
import { useAnomaly } from '../hooks/use-anomalies'
import { StatusBadge } from '@/shared/components/ui'
import { anomalies as mockAnomalies } from '@/mocks/data'

export function AnomalyDetailPage() {
  const { anomalyId } = useParams({ strict: false }) as { anomalyId: string }
  const id = Number(anomalyId)

  const { data: anomaly, isLoading } = useAnomaly(id)
  const fallback = mockAnomalies.find((a) => a.id === id)
  const data = anomaly ?? fallback

  if (isLoading && !fallback) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white/[0.05] rounded-xl w-64" />
        <div className="card p-6 h-48" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={40} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-semibold">Anomaly not found</p>
        <Link to="/anomalies" className="mt-4 text-[12px] text-primary hover:text-primary-light">
          ← Back to anomalies
        </Link>
      </div>
    )
  }

  const isCritical = data.severity === 'critical'

  return (
    <div className="space-y-5 animate-slide-up">
      <Link
        to="/anomalies"
        className="inline-flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to anomalies
      </Link>

      <div className={`card p-6 ${isCritical ? 'border-l-danger' : 'border-l-warning'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isCritical
                    ? 'bg-danger/10 border-danger/20 text-danger'
                    : 'bg-warning/10 border-warning/20 text-warning'
                }`}
              >
                <AlertTriangle size={18} />
              </div>
              <h2 className="text-[18px] font-bold text-white">{data.type}</h2>
            </div>
            <p className="text-[13px] text-slate-400">{data.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={data.severity} size="md" />
            <span className="text-[11px] text-slate-600">{data.time}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Impact</p>
            <div
              className={`flex items-center gap-1.5 text-[12px] font-semibold ${
                isCritical ? 'text-danger' : 'text-warning'
              }`}
            >
              <AlertTriangle size={12} />
              {data.impact}
            </div>
          </div>
          {data.journey && (
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Linked Journey</p>
              <div className="flex items-center gap-1.5 text-[12px] text-info">
                <GitBranch size={12} />
                {data.journey}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
