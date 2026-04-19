import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { HealthData } from '../types/overview.types'

interface HealthChartProps {
  data: HealthData[]
}

export function HealthChart({ data }: HealthChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="card p-5 flex flex-col">
      <p className="section-title mb-1">System Health</p>
      <p className="section-sub mb-4">All services</p>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                dataKey="value"
                strokeWidth={0}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-ink">{total}</span>
            <span className="text-[10px] text-ink-muted">total</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {data.map((d) => (
          <div key={d.name} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-[10px] text-ink-muted">{d.name}</span>
            </div>
            <p className="text-base font-bold text-ink">{d.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
