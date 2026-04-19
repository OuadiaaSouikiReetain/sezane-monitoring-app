import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'

const COLORS = {
  neutral: {
    icon: 'text-ink-muted bg-elevated',
    border: 'border-border',
  },
  green: {
    icon: 'text-success bg-success-bg',
    border: 'border-success-border',
  },
  red: {
    icon: 'text-danger bg-danger-bg',
    border: 'border-danger-border',
  },
  amber: {
    icon: 'text-warning bg-warning-bg',
    border: 'border-warning-border',
  },
}

function parseTrend(trend?: string) {
  if (!trend) return null
  const str = String(trend)
  const isPositive = str.startsWith('+')
  const isNegative = str.startsWith('-')
  if (isPositive) return { dir: 'up' as const, label: str }
  if (isNegative) return { dir: 'down' as const, label: str }
  return { dir: 'neutral' as const, label: str }
}

interface KpiCardProps {
  title: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  color?: 'neutral' | 'green' | 'red' | 'amber'
  trend?: string
}

export function KpiCard({ title, value, sub, icon: Icon, color = 'neutral', trend }: KpiCardProps) {
  const c = COLORS[color] ?? COLORS.neutral
  const t = parseTrend(trend)

  return (
    <div className={`group relative bg-card border rounded-2xl p-5 overflow-hidden
      cursor-default transition-all duration-200
      hover:border-border-strong hover:shadow-card-md hover:scale-[1.015]
      shadow-card ${c.border}`}>

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.08em]">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}
            transition-transform duration-200 group-hover:scale-110`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-[28px] font-bold text-ink leading-none tracking-tight">{value}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        {sub && <p className="text-[11px] text-ink-muted leading-snug flex-1">{sub}</p>}
        {t && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0
            ${t.dir === 'up' ? 'bg-success-bg text-success' : t.dir === 'down' ? 'bg-danger-bg text-danger' : 'bg-elevated text-ink-faint'}`}>
            {t.dir === 'up'      && <TrendingUp  size={10} />}
            {t.dir === 'down'    && <TrendingDown size={10} />}
            {t.dir === 'neutral' && <Minus size={10} />}
            {t.label}
          </span>
        )}
      </div>
    </div>
  )
}
