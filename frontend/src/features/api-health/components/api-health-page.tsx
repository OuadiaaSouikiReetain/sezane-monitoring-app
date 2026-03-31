import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { Wifi } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui'
import { useApiHealth } from '../hooks/use-api-health'
import { apis as mockApis } from '@/mocks/data'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1A2234',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  labelStyle: { color: '#94A3B8', fontWeight: 600 },
  itemStyle: { color: '#E2E8F0' },
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
  const color = value >= danger ? '#EF4444' : value >= warn ? '#F59E0B' : '#22C55E'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
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
            className={`card transition-all duration-200 hover:scale-[1.02] hover:shadow-card-hover p-4 rounded-2xl
              ${api.status === 'critical' ? 'border-danger/30 bg-danger/[0.04]' : api.status === 'degraded' ? 'border-warning/25' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <StatusBadge status={api.status} />
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  api.status === 'healthy'
                    ? 'bg-success/10 text-success'
                    : api.status === 'degraded'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-danger/10 text-danger'
                }`}
              >
                <Wifi size={13} />
              </div>
            </div>
            <p className="text-[13px] font-bold text-white mb-3 leading-tight">{api.name}</p>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-600 uppercase tracking-wide font-semibold">Latency</span>
                </div>
                <LatencyBar value={api.latency} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-600 uppercase tracking-wide font-semibold">P95</span>
                </div>
                <LatencyBar value={api.p95} danger={500} />
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-white/[0.04]">
                <span className="text-slate-600">Success</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    api.successRate < 95 ? 'text-danger' : api.successRate < 98 ? 'text-warning' : 'text-success'
                  }`}
                >
                  {api.successRate}%
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Uptime</span>
                <span className="font-mono text-slate-300">{api.uptime}</span>
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
          <div className="flex gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-primary/60" />Avg
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-warning/60" />P95
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={latencyData} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" width={48} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="latency" radius={[4, 4, 0, 0] as [number, number, number, number]} maxBarSize={36}>
              {latencyData.map((e) => (
                <Cell key={e.name} fill={e.latency > 200 ? '#F59E0B' : '#6366F1'} fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="p95" radius={[4, 4, 0, 0] as [number, number, number, number]} maxBarSize={36}>
              {latencyData.map((e) => (
                <Cell key={e.name} fill={e.p95 > 500 ? '#EF4444' : '#F59E0B'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
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
                <td><span className="font-semibold text-slate-200">{api.name}</span></td>
                <td><StatusBadge status={api.status} /></td>
                <td><span className="font-mono text-[12px] text-slate-300 tabular-nums">{api.latency}ms</span></td>
                <td>
                  <span
                    className={`font-mono text-[12px] tabular-nums font-semibold ${
                      api.p95 > 500 ? 'text-danger' : api.p95 > 200 ? 'text-warning' : 'text-slate-300'
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
                  <span className="font-mono text-[12px] text-slate-400 tabular-nums">{api.uptime}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
