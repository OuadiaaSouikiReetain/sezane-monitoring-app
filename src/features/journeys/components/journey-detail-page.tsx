import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { useJourney } from '../hooks/use-journeys'
import { StatusBadge } from '@/shared/components/ui'
import { getSlaColor, getSlaBarColor } from '@/entities/journey/ui'
import { journeys as mockJourneys } from '@/mocks/data'

export function JourneyDetailPage() {
  const { journeyId } = useParams({ strict: false }) as { journeyId: string }
  const id = Number(journeyId)

  const { data: journey, isLoading } = useJourney(id)
  const fallback = mockJourneys.find((j) => j.id === id)
  const data = journey ?? fallback

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
        <GitBranch size={40} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-semibold">Journey not found</p>
        <Link to="/journeys" className="mt-4 text-[12px] text-primary hover:text-primary-light">
          ← Back to journeys
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back nav */}
      <Link
        to="/journeys"
        className="inline-flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to journeys
      </Link>

      {/* Detail card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                <GitBranch size={18} className="text-primary-light" />
              </div>
              <h2 className="text-[18px] font-bold text-white">{data.name}</h2>
            </div>
            <p className="text-[13px] text-slate-500">{data.bu} · Managed by {data.owner}</p>
          </div>
          <StatusBadge status={data.status} size="md" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Entry Volume</p>
            <p className="text-[24px] font-bold text-white tabular-nums">{data.entries.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">SLA</p>
            <div className="flex items-center gap-3">
              <p className={`text-[24px] font-bold tabular-nums ${getSlaColor(data.sla)}`}>{data.sla}%</p>
            </div>
            <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getSlaBarColor(data.sla)}`}
                style={{ width: `${Math.min(data.sla, 100)}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Anomalies</p>
            <p className={`text-[24px] font-bold tabular-nums ${data.anomalies > 0 ? 'text-danger' : 'text-success'}`}>
              {data.anomalies}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
