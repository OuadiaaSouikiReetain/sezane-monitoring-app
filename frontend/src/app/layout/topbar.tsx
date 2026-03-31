import { useState, useEffect } from 'react'
import { Search, RefreshCw, Bell, ChevronRight, Command } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { useUiStore } from '@/app/store/ui-store'

const PAGES: Record<string, { label: string; sub: string }> = {
  '/':            { label: 'Overview Dashboard',    sub: 'Global system health' },
  '/journeys':    { label: 'Journey Control',        sub: 'Monitor customer journeys' },
  '/automations': { label: 'Automation Ops',         sub: 'Track automation jobs' },
  '/api-health':  { label: 'API Health Hub',         sub: 'System APIs performance' },
  '/anomalies':   { label: 'Anomaly Center',         sub: 'Active anomalies' },
  '/alerting':    { label: 'Alerting & Escalation',  sub: 'Alerts management' },
  '/analytics':   { label: 'Analytics Studio',       sub: 'Business performance' },
  '/settings':    { label: 'Settings / Rules',       sub: 'Monitoring configuration' },
}

export function Topbar() {
  const location = useLocation()
  const { notificationCount } = useUiStore()
  const [time, setTime] = useState(new Date())
  const [spinning, setSpinning] = useState(false)

  const pathKey = '/' + location.pathname.split('/')[1]
  const info = PAGES[pathKey] ?? PAGES['/']

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const refresh = () => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 700)
  }

  return (
    <header className="h-[56px] bg-surface/80 backdrop-blur-sm border-b border-white/[0.05] flex items-center px-6 gap-5 flex-shrink-0 sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[11px] text-slate-600 font-medium">SFMC</span>
        <ChevronRight size={12} className="text-slate-700" />
        <h1 className="text-[13px] font-semibold text-slate-200 truncate">{info.label}</h1>
        <span className="hidden sm:inline text-[11px] text-slate-600">— {info.sub}</span>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center w-52">
        <Search size={13} className="absolute left-3 text-slate-600 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-8 bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-10 text-[12px] text-slate-300 placeholder-slate-600
            focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all duration-150"
        />
        <div className="absolute right-2.5 flex items-center gap-0.5">
          <Command size={10} className="text-slate-700" />
          <span className="text-[10px] text-slate-700 font-medium">K</span>
        </div>
      </div>

      {/* Refresh */}
      <button
        onClick={refresh}
        title="Refresh data"
        className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center
          text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] hover:border-white/[0.1] transition-all duration-150"
      >
        <RefreshCw size={13} className={spinning ? 'animate-spin text-primary-light' : ''} />
      </button>

      {/* Notifications */}
      <button className="relative w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center
        text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] hover:border-white/[0.1] transition-all duration-150">
        <Bell size={13} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold
            shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            {notificationCount}
          </span>
        )}
      </button>

      {/* Live clock */}
      <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/[0.08] border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-semibold text-success/80 font-mono">
            {time.toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>
    </header>
  )
}
