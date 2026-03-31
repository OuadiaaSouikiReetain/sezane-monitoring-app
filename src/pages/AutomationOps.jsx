import StatusBadge from '../components/StatusBadge'
import { automations } from '../data/mockData'
import { Clock, AlertTriangle, CheckCircle, Play } from 'lucide-react'

export default function AutomationOps() {
  const totalOk   = automations.filter(a => a.status === 'healthy').length
  const withDelay = automations.filter(a => a.delay).length
  const critical  = automations.filter(a => a.status === 'critical').length

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { v: automations.length, label: 'Total Jobs',   icon: Play,          cls: 'text-primary-light bg-primary/10 border-primary/20' },
          { v: totalOk,            label: 'Running OK',   icon: CheckCircle,   cls: 'text-success bg-success/10 border-success/20' },
          { v: withDelay,          label: 'With Delays',  icon: Clock,         cls: 'text-warning bg-warning/10 border-warning/20' },
          { v: critical,           label: 'Critical',     icon: AlertTriangle, cls: 'text-danger bg-danger/10 border-danger/20' },
        ].map(({ v, label, icon: Icon, cls }) => (
          <div key={label} className="card-hover rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cls}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">{v}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="section-title">Automation Jobs</p>
          <span className="section-sub">{automations.length} jobs monitored</span>
        </div>
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Name', 'Frequency', 'Last Run', 'Duration', 'Status', 'Delay'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {automations.map((a) => (
                <tr key={a.id}
                  className={a.delay ? 'border-l-warning' : a.status === 'critical' ? 'border-l-danger' : ''}>
                  <td>
                    <span className="font-semibold text-slate-200">{a.name}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-lg w-fit">
                      <Clock size={11} className="text-slate-600" />
                      {a.frequency}
                    </div>
                  </td>
                  <td><span className="text-[12px] text-slate-400">{a.lastRun}</span></td>
                  <td>
                    <span className="font-mono text-[12px] text-slate-300 tabular-nums">{a.duration}</span>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    {a.delay
                      ? <div className="flex items-center gap-1.5 text-[11px] font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full w-fit">
                          <AlertTriangle size={11} />
                          Detected
                        </div>
                      : <span className="text-[11px] text-slate-700">None</span>
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
