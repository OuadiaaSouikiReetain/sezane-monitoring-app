import type { Status, AlertStatus, Severity } from '@/shared/types'

interface StatusConfig {
  label: string
  cls: string
  dot: string
  pulse?: boolean
}

const CONFIG: Record<string, StatusConfig> = {
  healthy: {
    label: 'Healthy',
    cls: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  degraded: {
    label: 'Degraded',
    cls: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  critical: {
    label: 'Critical',
    cls: 'bg-danger/10 text-danger border-danger/25',
    dot: 'bg-danger',
    pulse: true,
  },
  info: {
    label: 'Info',
    cls: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  unknown: {
    label: 'Unknown',
    cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dot: 'bg-slate-500',
  },
  open: {
    label: 'Open',
    cls: 'bg-danger/10 text-danger border-danger/25',
    dot: 'bg-danger',
    pulse: true,
  },
  acknowledged: {
    label: 'Acknowledged',
    cls: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  resolved: {
    label: 'Resolved',
    cls: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
}

interface StatusBadgeProps {
  status: Status | AlertStatus | Severity
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const c = CONFIG[status] ?? CONFIG.info
  const sz = size === 'sm' ? 'px-2 py-[3px] text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border tracking-tight ${sz} ${c.cls}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`}
      />
      {c.label}
    </span>
  )
}
