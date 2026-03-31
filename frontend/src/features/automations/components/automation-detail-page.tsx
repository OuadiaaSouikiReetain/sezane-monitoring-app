import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, Cog, Clock, AlertTriangle } from 'lucide-react'
import { useAutomation } from '../hooks/use-automations'
import { StatusBadge } from '@/shared/components/ui'
import { automations as mockAutomations } from '@/mocks/data'

export function AutomationDetailPage() {
  const { automationId } = useParams({ strict: false }) as { automationId: string }
  const id = Number(automationId)

  const { data: automation, isLoading } = useAutomation(id)
  const fallback = mockAutomations.find((a) => a.id === id)
  const data = automation ?? fallback

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
        <Cog size={40} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-semibold">Automation not found</p>
        <Link to="/automations" className="mt-4 text-[12px] text-primary hover:text-primary-light">
          ← Back to automations
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <Link
        to="/automations"
        className="inline-flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to automations
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                <Cog size={18} className="text-primary-light" />
              </div>
              <h2 className="text-[18px] font-bold text-white">{data.name}</h2>
            </div>
            <p className="text-[13px] text-slate-500">Schedule: {data.frequency}</p>
          </div>
          <StatusBadge status={data.status} size="md" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Last Run</p>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-500" />
              <p className="text-[18px] font-bold text-white">{data.lastRun}</p>
            </div>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Duration</p>
            <p className="text-[18px] font-bold text-white font-mono">{data.duration}</p>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-2">Delay Detected</p>
            {data.delay ? (
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle size={16} />
                <p className="text-[18px] font-bold">Yes</p>
              </div>
            ) : (
              <p className="text-[18px] font-bold text-success">No</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
