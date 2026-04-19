import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-elevated border border-border flex items-center justify-center mb-4 text-ink-muted">
          {icon}
        </div>
      )}
      <p className="text-[14px] font-semibold text-ink mb-1">{title}</p>
      {description && (
        <p className="text-[12px] text-ink-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
