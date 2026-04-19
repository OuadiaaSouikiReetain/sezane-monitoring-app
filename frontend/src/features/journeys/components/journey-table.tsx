import { StatusBadge } from '@/shared/components/ui'
import { getSlaColor, getSlaBarColor, getStatusBorderClass } from '@/entities/journey/ui'
import type { Journey } from '@/entities/journey/model'

interface JourneyTableProps {
  journeys: Journey[]
  total: number
}

export function JourneyTable({ journeys, total }: JourneyTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <p className="section-title">Journey List</p>
        <span className="section-sub">{journeys.length} / {total} shown</span>
      </div>
      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              {['Journey Name', 'Business Unit', 'Owner', 'Status', 'Entry Volume', 'SLA', 'Anomalies'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {journeys.map((j) => (
              <tr
                key={j.id}
                className={
                  j.status === 'critical'
                    ? 'border-l-danger'
                    : j.status === 'degraded'
                    ? 'border-l-warning'
                    : ''
                }
              >
                <td>
                  <span className="font-semibold text-ink">{j.name}</span>
                </td>
                <td>
                  <span className="text-[12px] text-ink-muted bg-elevated px-2 py-0.5 rounded-md border border-border">
                    {j.bu}
                  </span>
                </td>
                <td>
                  <span className="text-[12px] text-ink-muted">{j.owner}</span>
                </td>
                <td>
                  <StatusBadge status={j.status} />
                </td>
                <td>
                  <span className="font-mono text-[12px] text-ink-sub tabular-nums">
                    {j.entries.toLocaleString()}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getSlaBarColor(j.sla)}`}
                        style={{ width: `${Math.min(j.sla, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-mono font-semibold tabular-nums ${getSlaColor(j.sla)}`}>
                      {j.sla}%
                    </span>
                  </div>
                </td>
                <td>
                  {j.anomalies > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold bg-danger-bg text-danger border border-danger-border">
                      {j.anomalies}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Suppress unused import warning
void getStatusBorderClass
