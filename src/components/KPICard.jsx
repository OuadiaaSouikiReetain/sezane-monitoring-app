import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLORS = {
  indigo: {
    icon: 'text-primary-light bg-primary/15',
    top: 'from-primary/60 to-transparent',
    trend_up: 'bg-primary/15 text-primary-light',
  },
  green: {
    icon: 'text-success bg-success/15',
    top: 'from-success/50 to-transparent',
    trend_up: 'bg-success/15 text-success',
  },
  red: {
    icon: 'text-danger bg-danger/15',
    top: 'from-danger/50 to-transparent',
    trend_up: 'bg-danger/15 text-danger',
  },
  amber: {
    icon: 'text-warning bg-warning/15',
    top: 'from-warning/50 to-transparent',
    trend_up: 'bg-warning/15 text-warning',
  },
}

function parseTrend(trend) {
  if (!trend) return null
  const str = String(trend)
  const isPositive = str.startsWith('+')
  const isNegative = str.startsWith('-')
  if (isPositive) return { dir: 'up', label: str }
  if (isNegative) return { dir: 'down', label: str }
  return { dir: 'neutral', label: str }
}

export default function KPICard({ title, value, sub, icon: Icon, color = 'indigo', trend }) {
  const c = COLORS[color] || COLORS.indigo
  const t = parseTrend(trend)

  return (
    <div className="group relative bg-card border border-white/[0.06] rounded-2xl p-5 overflow-hidden
      cursor-default transition-all duration-200
      hover:border-white/[0.1] hover:bg-elevated hover:shadow-card-hover hover:scale-[1.015]
      shadow-card">

      {/* Top gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${c.top}`} />

      {/* Subtle background glow blob */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.04] blur-2xl bg-white pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}
            transition-transform duration-200 group-hover:scale-110`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-[28px] font-bold text-white leading-none tracking-tight">{value}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        {sub && <p className="text-[11px] text-slate-500 leading-snug flex-1">{sub}</p>}
        {t && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0
            ${t.dir === 'up' ? 'bg-success/15 text-success' : t.dir === 'down' ? 'bg-danger/15 text-danger' : 'bg-white/[0.06] text-slate-400'}`}>
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
