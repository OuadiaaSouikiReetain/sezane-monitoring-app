import { useState, useEffect } from 'react'
import { Search, RefreshCw, Bell, ChevronRight } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { useUiStore } from '@/app/store/ui-store'

const PAGES: Record<string, { label: string; sub: string }> = {
  '/':            { label: 'Overview',          sub: 'Global system health'      },
  '/journeys':    { label: 'Journey Control',   sub: 'Monitor customer journeys' },
  '/automations': { label: 'Automation Ops',    sub: 'Track automation jobs'     },
  '/api-health':  { label: 'API Health Hub',    sub: 'System APIs performance'   },
  '/anomalies':   { label: 'Anomaly Center',    sub: 'Active anomalies'          },
  '/alerting':    { label: 'Alerting',          sub: 'Alerts management'         },
  '/analytics':   { label: 'Analytics Studio',  sub: 'Business performance'      },
  '/settings':    { label: 'Settings / Rules',  sub: 'Monitoring configuration'  },
}

export function Topbar() {
  const location  = useLocation()
  const { notificationCount } = useUiStore()
  const [time, setTime]         = useState(new Date())
  const [spinning, setSpinning] = useState(false)

  const pathKey = '/' + location.pathname.split('/')[1]
  const info    = PAGES[pathKey] ?? PAGES['/']

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const refresh = () => { setSpinning(true); setTimeout(() => setSpinning(false), 700) }

  return (
    <header className="h-[56px] bg-surface border-b border-border flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-20">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[11px] text-ink-faint font-medium">SFMC</span>
        <ChevronRight size={11} className="text-ink-faint" />
        <h1 className="text-[14px] font-semibold text-ink truncate">{info.label}</h1>
        <span className="hidden sm:inline text-[12px] text-ink-muted">— {info.sub}</span>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center w-52">
        <Search size={12} className="absolute left-3 text-ink-faint pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-8 bg-bg border border-border rounded-lg pl-8 pr-3 text-[12px] text-ink placeholder-ink-faint
            focus:outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink/10 transition-all"
        />
      </div>

      {/* Refresh */}
      <button onClick={refresh}
        className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:bg-elevated transition-all">
        <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
      </button>

      {/* Notifications */}
      <button className="relative w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:bg-elevated transition-all">
        <Bell size={13} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            {notificationCount}
          </span>
        )}
      </button>

      {/* Clock */}
      <div className="pl-3 border-l border-border">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-bg border border-success-border">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-semibold font-mono text-success">
            {time.toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>
    </header>
  )
}
