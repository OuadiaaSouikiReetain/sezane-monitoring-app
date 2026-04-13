import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, GitBranch, Cog, Globe, AlertTriangle,
  Bell, BarChart3, Settings, Zap, ChevronRight,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  badge: string | null
}

const nav: NavItem[] = [
  { to: '/',           label: 'Overview',        icon: LayoutDashboard, badge: null },
  { to: '/journeys',   label: 'Journey Control',  icon: GitBranch,       badge: '2' },
  { to: '/automations',label: 'Automation Ops',   icon: Cog,             badge: null },
  { to: '/api-health', label: 'API Health Hub',   icon: Globe,           badge: null },
  { to: '/anomalies',  label: 'Anomaly Center',   icon: AlertTriangle,   badge: '6' },
  { to: '/alerting',   label: 'Alerting',         icon: Bell,            badge: '3' },
  { to: '/analytics',  label: 'Analytics Studio', icon: BarChart3,       badge: null },
  { to: '/settings',   label: 'Settings / Rules', icon: Settings,        badge: null },
]

export function Sidebar() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  return (
    <aside className="w-[220px] min-h-screen bg-surface flex flex-col border-r border-white/[0.05] flex-shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div
            className="relative w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
            }}
          >
            <Zap size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-none tracking-tight">
              SFMC Monitor
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Control Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em] px-3 mb-3">
          Navigation
        </p>
        {nav.map(({ to, label, icon: Icon, badge }) => {
          const isActive =
            to === '/'
              ? pathname === '/'
              : pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'text-primary-light'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
              style={
                isActive
                  ? {
                      background: 'rgba(99,102,241,0.12)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(99,102,241,0.25), 0 0 20px rgba(99,102,241,0.08)',
                    }
                  : {}
              }
            >
              <Icon
                size={15}
                className={
                  isActive
                    ? 'text-primary-light'
                    : 'text-slate-600 group-hover:text-slate-400'
                }
              />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center ${
                    isActive
                      ? 'bg-primary/30 text-primary-light'
                      : 'bg-white/[0.07] text-slate-400'
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* System status pill */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/[0.07] border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-success font-medium">All systems nominal</span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 pb-5 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            AO
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate leading-none">Admin Ops</p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">admin@sfmc.io</p>
          </div>
          <ChevronRight size={13} className="text-slate-600 flex-shrink-0" />
        </div>
      </div>
    </aside>
  )
}
