import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, GitBranch, Cog, Globe, AlertTriangle,
  Bell, BarChart3, Settings, Activity,
} from 'lucide-react'

interface NavItem {
  to:    string
  label: string
  icon:  React.ElementType
  badge: string | null
}

const nav: NavItem[] = [
  { to: '/',            label: 'Overview',         icon: LayoutDashboard, badge: null },
  { to: '/journeys',    label: 'Journey Control',  icon: GitBranch,       badge: null },
  { to: '/automations', label: 'Automation Ops',   icon: Cog,             badge: null },
  { to: '/api-health',  label: 'API Health Hub',   icon: Globe,           badge: null },
  { to: '/anomalies',   label: 'Anomaly Center',   icon: AlertTriangle,   badge: null },
  { to: '/alerting',    label: 'Alerting',         icon: Bell,            badge: null },
  { to: '/analytics',   label: 'Analytics Studio', icon: BarChart3,       badge: null },
  { to: '/settings',    label: 'Settings / Rules', icon: Settings,        badge: null },
]

export function Sidebar() {
  const routerState = useRouterState()
  const pathname    = routerState.location.pathname

  return (
    <aside className="w-[220px] min-h-screen bg-surface flex flex-col flex-shrink-0 border-r border-border">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center flex-shrink-0">
            <Activity size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-ink leading-none tracking-tight">SFMC Monitor</p>
            <p className="text-[10px] text-ink-faint mt-0.5 font-medium">Control Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.1em] px-2 mb-3">
          Navigation
        </p>
        {nav.map(({ to, label, icon: Icon, badge }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`
                w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-[13px] font-medium transition-all duration-150
                ${isActive
                  ? 'bg-primary-bg text-ink border border-border shadow-card'
                  : 'text-ink-muted hover:text-ink hover:bg-elevated'}
              `}
            >
              <Icon
                size={15}
                className={isActive ? 'text-ink' : 'text-ink-faint group-hover:text-ink-muted'}
              />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-ink text-white' : 'bg-elevated text-ink-muted'
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success-bg border border-success-border">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-success font-medium">All systems nominal</span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 pb-5 pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            AO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-ink truncate leading-none">Admin Ops</p>
            <p className="text-[10px] text-ink-faint mt-0.5 truncate">admin@sfmc.io</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
