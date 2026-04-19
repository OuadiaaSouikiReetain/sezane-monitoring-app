import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { Wifi } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useApiHealth } from '../hooks/use-api-health'
import { apis as mockApis } from '@/mocks/data'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  labelStyle: { color: '#6B7280', fontWeight: 600 },
  itemStyle: { color: '#111827' },
  formatter: (v: number) => [`${v}ms`],
}

interface LatencyBarProps {
  value: number
  max?: number
  warn?: number
  danger?: number
}

function LatencyBar({ value, max = 900, warn = 200, danger = 500 }: LatencyBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  const color = value >= danger ? '#DC2626' : value >= warn ? '#D97706' : '#059669'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-border-light rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span
        className="text-[11px] font-mono tabular-nums font-semibold w-12 text-right"
        style={{ color }}
      >
        {value}ms
      </span>
    </div>
  )
}

export function ApiHealthPage() {
  const { data: apiData } = useApiHealth()
  const apis = apiData ?? mockApis

  const latencyData = apis.map((a) => ({
    name: a.name.replace(' API', ''),
    latency: a.latency,
    p95: a.p95,
  }))

  return (
    <div className="space-y-5 animate-slide-up">
      {/* API Cards */}
      <div className="grid grid-cols-5 gap-3">
        {apis.map((api) => (
          <div
            key={api.name}
            className={`card transition-all duration-200 hover:scale-[1.02] hover:shadow-card-md p-4 rounded-2xl
              ${api.status === 'critical' ? 'border-danger-border bg-danger-bg' : api.status === 'degraded' ? 'border-warning-border' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <StatusBadge status={api.status} />
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  api.status === 'healthy'
                    ? 'bg-success-bg text-success'
                    : api.status === 'degraded'
                    ? 'bg-warning-bg text-warning'
                    : 'bg-danger-bg text-danger'
                }`}
              >
                <Wifi size={13} />
              </div>
            </div>
            <p className="text-[13px] font-bold text-ink mb-3 leading-tight">{api.name}</p>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-ink-faint uppercase tracking-wide font-semibold">Latency</span>
                </div>
                <LatencyBar value={api.latency} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-ink-faint uppercase tracking-wide font-semibold">P95</span>
                </div>
                <LatencyBar value={api.p95} danger={500} />
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-border-light">
                <span className="text-ink-faint">Success</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    api.successRate < 95 ? 'text-danger' : api.successRate < 98 ? 'text-warning' : 'text-success'
                  }`}
                >
                  {api.successRate}%
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-faint">Uptime</span>
                <span className="font-mono text-ink-sub">{api.uptime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="section-title">Latency Comparison</p>
            <p className="section-sub mt-0.5">Average vs P95 across all APIs</p>
          </div>
          <div className="flex gap-4 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-ink opacity-60" />Avg
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-warning opacity-60" />P95
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={latencyData} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" width={48} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="latency" radius={[4, 4, 0, 0] as [number, number, number, number]} maxBarSize={36}>
              {latencyData.map((e) => (
                <Cell key={e.name} fill={e.latency > 200 ? '#D97706' : '#111827'} fillOpacity={0.75} />
              ))}
            </Bar>
            <Bar dataKey="p95" radius={[4, 4, 0, 0] as [number, number, number, number]} maxBarSize={36}>
              {latencyData.map((e) => (
                <Cell key={e.name} fill={e.p95 > 500 ? '#DC2626' : '#D97706'} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="section-title">API Summary</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              {['API', 'Status', 'Avg Latency', 'P95 Latency', 'Success Rate', 'Uptime'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apis.map((api) => (
              <tr
                key={api.name}
                className={
                  api.status === 'critical'
                    ? 'border-l-danger'
                    : api.status === 'degraded'
                    ? 'border-l-warning'
                    : ''
                }
              >
                <td><span className="font-semibold text-ink">{api.name}</span></td>
                <td><StatusBadge status={api.status} /></td>
                <td><span className="font-mono text-[12px] text-ink-sub tabular-nums">{api.latency}ms</span></td>
                <td>
                  <span
                    className={`font-mono text-[12px] tabular-nums font-semibold ${
                      api.p95 > 500 ? 'text-danger' : api.p95 > 200 ? 'text-warning' : 'text-ink-sub'
                    }`}
                  >
                    {api.p95}ms
                  </span>
                </td>
                <td>
                  <span
                    className={`font-mono text-[12px] font-bold tabular-nums ${
                      api.successRate < 95 ? 'text-danger' : api.successRate < 98 ? 'text-warning' : 'text-success'
                    }`}
                  >
                    {api.successRate}%
                  </span>
                </td>
                <td>
                  <span className="font-mono text-[12px] text-ink-muted tabular-nums">{api.uptime}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
