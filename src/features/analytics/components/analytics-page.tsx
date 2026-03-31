import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useAnalyticsKpis, usePerformanceTrend } from '../hooks/use-analytics'
import { analyticsKpis as mockKpis, performanceTrend as mockTrend } from '@/mocks/data'

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
  formatter: (v: number) => [`${v}%`],
}

const BU_METRICS = {
  France:  { successRate: 97.1, sla: 95.2, delivery: 99.0 },
  Belgium: { successRate: 94.3, sla: 91.8, delivery: 98.7 },
  Germany: { successRate: 96.8, sla: 93.4, delivery: 98.2 },
}

const LINE_COLORS = { successRate: '#6366F1', deliveryRate: '#22C55E', sla: '#F59E0B' }
const LINE_LABELS: Record<string, string> = { successRate: 'Success Rate', deliveryRate: 'Delivery Rate', sla: 'SLA Performance' }

export function AnalyticsPage() {
  const { data: kpisData }  = useAnalyticsKpis()
  const { data: trendData } = usePerformanceTrend()

  const kpis = kpisData  ?? mockKpis
  const trend = trendData ?? mockTrend

  return (
    <div className="space-y-5 animate-slide-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-hover rounded-2xl p-5 transition-all duration-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.07em] mb-3">
              {kpi.label}
            </p>
            <p className="text-[30px] font-bold text-white leading-none tracking-tight mb-3">{kpi.value}</p>
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold w-fit px-2 py-0.5 rounded-full ${
                kpi.up ? 'bg-success/[0.12] text-success' : 'bg-danger/[0.12] text-danger'
              }`}
            >
              {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {kpi.trend} vs last week
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="section-title">Performance Trends</p>
            <p className="section-sub mt-0.5">6-week rolling window</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[89, 100]}
              unit="%"
              width={50}
            />
            <ReferenceLine
              y={95}
              stroke="rgba(239,68,68,0.25)"
              strokeDasharray="4 4"
              label={{ value: 'SLA target', fill: '#EF4444', fontSize: 10, position: 'insideBottomRight' }}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend
              formatter={(v) => (
                <span className="text-[11px] text-slate-400">{LINE_LABELS[v] ?? v}</span>
              )}
            />
            {Object.entries(LINE_COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                strokeDasharray={key === 'sla' ? '5 4' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Business Units */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="section-title">Business Unit Breakdown</p>
          <span className="section-sub">— current period</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(BU_METRICS).map(([bu, metrics]) => (
            <div key={bu} className="card-hover rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-bold text-white">{bu}</p>
                <span className="text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                {(
                  [
                    { label: 'Success Rate', value: metrics.successRate, warn: 95 },
                    { label: 'SLA',          value: metrics.sla,         warn: 93 },
                    { label: 'Delivery',     value: metrics.delivery,    warn: 98 },
                  ] as { label: string; value: number; warn: number }[]
                ).map(({ label, value, warn }) => {
                  const color =
                    value >= warn ? '#6366F1' : value >= warn - 3 ? '#F59E0B' : '#EF4444'
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className="font-mono font-bold tabular-nums" style={{ color }}>
                          {value}%
                        </span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${value}%`, background: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
