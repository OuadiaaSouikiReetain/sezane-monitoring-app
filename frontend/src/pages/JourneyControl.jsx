import { useState } from 'react'
import { Filter, SlidersHorizontal } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { journeys } from '../data/mockData'

const BUS = ['All', 'France', 'Belgium', 'Germany', 'Spain', 'UK', 'Italy']
const STATUSES = ['All', 'healthy', 'degraded', 'critical']

function StatPill({ value, label, color }) {
  const colors = {
    green: 'bg-success/10 border-success/20',
    amber: 'bg-warning/10 border-warning/20',
    red:   'bg-danger/10  border-danger/20',
    neutral: 'bg-white/[0.04] border-white/[0.06]',
  }
  const textColors = { green: 'text-success', amber: 'text-warning', red: 'text-danger', neutral: 'text-white' }
  return (
    <div className={`card-hover rounded-2xl p-4 border ${colors[color]} flex items-center gap-4`}>
      <span className={`text-3xl font-bold tracking-tight ${textColors[color]}`}>{value}</span>
      <span className="text-[12px] text-slate-500 font-medium leading-tight">{label}</span>
    </div>
  )
}

export default function JourneyControl() {
  const [bu, setBu] = useState('All')
  const [status, setStatus] = useState('All')

  const filtered = journeys.filter(j =>
    (bu === 'All' || j.bu === bu) && (status === 'All' || j.status === status)
  )

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Stat Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatPill value={journeys.length} label="Total Journeys" color="neutral" />
        <StatPill value={journeys.filter(j => j.status === 'healthy').length}  label="Healthy"  color="green" />
        <StatPill value={journeys.filter(j => j.status === 'degraded').length} label="Degraded" color="amber" />
        <StatPill value={journeys.filter(j => j.status === 'critical').length} label="Critical" color="red" />
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wide pr-3 border-r border-white/[0.06]">
          <SlidersHorizontal size={13} />
          Filters
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {BUS.map((b) => (
            <button key={b} onClick={() => setBu(b)}
              className={bu === b ? 'filter-pill-active' : 'filter-pill-inactive'}>
              {b}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/[0.06] mx-1" />

        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={status === s ? 'filter-pill-active' : 'filter-pill-inactive capitalize'}>
              {s}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[11px] text-slate-600">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="section-title">Journey List</p>
          <span className="section-sub">{filtered.length} / {journeys.length} shown</span>
        </div>
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Journey Name', 'Business Unit', 'Owner', 'Status', 'Entry Volume', 'SLA', 'Anomalies'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id}
                  className={j.status === 'critical' ? 'border-l-danger' : j.status === 'degraded' ? 'border-l-warning' : ''}>
                  <td>
                    <span className="font-semibold text-slate-200">{j.name}</span>
                  </td>
                  <td>
                    <span className="text-[12px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                      {j.bu}
                    </span>
                  </td>
                  <td><span className="text-[12px] text-slate-400">{j.owner}</span></td>
                  <td><StatusBadge status={j.status} /></td>
                  <td>
                    <span className="font-mono text-[12px] text-slate-300 tabular-nums">
                      {j.entries.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${j.sla >= 95 ? 'bg-success' : j.sla >= 85 ? 'bg-warning' : 'bg-danger'}`}
                          style={{ width: `${Math.min(j.sla, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-mono font-semibold tabular-nums
                        ${j.sla >= 95 ? 'text-success' : j.sla >= 85 ? 'text-warning' : 'text-danger'}`}>
                        {j.sla}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {j.anomalies > 0
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold bg-danger/15 text-danger border border-danger/25">
                          {j.anomalies}
                        </span>
                      : <span className="text-[11px] text-slate-700">—</span>
                    }
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
