import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useAnalyticsKpis, usePerformanceTrend } from '../hooks/use-analytics'
import { analyticsKpis as mockKpis, performanceTrend as mockTrend } from '@/mocks/data'

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
  formatter: (v: number) => [`${v}%`],
}

const BU_METRICS = {
  France:  { successRate: 97.1, sla: 95.2, delivery: 99.0 },
  Belgium: { successRate: 94.3, sla: 91.8, delivery: 98.7 },
  Germany: { successRate: 96.8, sla: 93.4, delivery: 98.2 },
}

const LINE_COLORS = { successRate: '#111827', deliveryRate: '#059669', sla: '#D97706' }
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
          <div key={kpi.label} className="card rounded-2xl p-5 transition-all duration-200 hover:shadow-card-md">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.07em] mb-3">
              {kpi.label}
            </p>
            <p className="text-[30px] font-bold text-ink leading-none tracking-tight mb-3">{kpi.value}</p>
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold w-fit px-2 py-0.5 rounded-full ${
                kpi.up ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
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
            <CartesianGrid strokeDasharray="2 4" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[89, 100]}
              unit="%"
              width={50}
            />
            <ReferenceLine
              y={95}
              stroke="#FECACA"
              strokeDasharray="4 4"
              label={{ value: 'SLA target', fill: '#DC2626', fontSize: 10, position: 'insideBottomRight' }}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend
              formatter={(v) => (
                <span className="text-[11px] text-ink-muted">{LINE_LABELS[v] ?? v}</span>
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
            <div key={bu} className="card rounded-2xl p-5 hover:shadow-card-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-bold text-ink">{bu}</p>
                <span className="text-[10px] font-semibold text-success bg-success-bg border border-success-border px-2 py-0.5 rounded-full">
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
                    value >= warn ? '#059669' : value >= warn - 3 ? '#D97706' : '#DC2626'
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-ink-muted font-medium">{label}</span>
                        <span className="font-mono font-bold tabular-nums" style={{ color }}>
                          {value}%
                        </span>
                      </div>
                      <div className="h-1 bg-border-light rounded-full overflow-hidden">
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
