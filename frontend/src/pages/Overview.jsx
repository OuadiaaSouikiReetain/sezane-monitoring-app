import { GitBranch, Cog, AlertCircle, Zap, ArrowRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { kpiData, activityChartData, anomalies, apis } from '../data/mockData'

const HEALTH_DATA = [
  { name: 'Healthy',  value: 189, color: '#22C55E' },
  { name: 'Degraded', value: 26,  color: '#F59E0B' },
  { name: 'Critical', value: 14,  color: '#EF4444' },
]

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1A2234',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  labelStyle: { color: '#94A3B8', fontWeight: 600 },
  itemStyle: { color: '#E2E8F0' },
}

export default function Overview() {
  return (
    <div className="space-y-5 animate-slide-up">

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Active Journeys"  value={kpiData.journeys.total}
          icon={GitBranch} color="indigo" trend="+4"
          sub={`${kpiData.journeys.healthy} healthy · ${kpiData.journeys.critical} critical`} />
        <KPICard title="Automations"      value={kpiData.automations.total}
          icon={Cog} color="green" trend="+1"
          sub={`${kpiData.automations.healthy} healthy · ${kpiData.automations.critical} critical`} />
        <KPICard title="Open Incidents"   value={kpiData.incidents.open}
          icon={AlertCircle} color="red" trend="-2"
          sub={`MTTR: ${kpiData.incidents.mttr} · ${kpiData.incidents.resolved} resolved`} />
        <KPICard title="Avg API Latency"  value={`${kpiData.apiLatency.avg}ms`}
          icon={Zap} color="amber" trend="+8ms"
          sub={`P95: ${kpiData.apiLatency.p95}ms · P99: ${kpiData.apiLatency.p99}ms`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Activity Chart */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-title">Activity — Last 24h</p>
              <p className="section-sub mt-0.5">Request volume and failure rate</p>
            </div>
            <div className="flex gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-[2px] rounded-full bg-primary inline-block" />
                Success
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-[2px] rounded-full bg-danger inline-block" />
                Failures
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={activityChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="success" stroke="#6366F1" strokeWidth={2} fill="url(#gSuccess)" />
              <Area type="monotone" dataKey="failures" stroke="#EF4444" strokeWidth={2} fill="url(#gFail)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Health Donut */}
        <div className="card p-5 flex flex-col">
          <p className="section-title mb-1">System Health</p>
          <p className="section-sub mb-4">All services</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={HEALTH_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={68}
                    dataKey="value" strokeWidth={0} paddingAngle={3}>
                    {HEALTH_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-white">{HEALTH_DATA.reduce((s,d) => s+d.value,0)}</span>
                <span className="text-[10px] text-slate-500">total</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {HEALTH_DATA.map((d) => (
              <div key={d.name} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[10px] text-slate-500">{d.name}</span>
                </div>
                <p className="text-base font-bold text-white">{d.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">

        {/* Recent Anomalies */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">Recent Anomalies</p>
              <p className="section-sub mt-0.5">{anomalies.filter(a => a.severity === 'critical').length} critical</p>
            </div>
            <button className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-light transition-colors">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {anomalies.slice(0, 4).map((a) => (
              <div key={a.id}
                className={`flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]
                  transition-colors hover:bg-white/[0.04] cursor-default
                  ${a.severity === 'critical' ? 'border-l-danger' : 'border-l-warning'}`}>
                <StatusBadge status={a.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-200 truncate">{a.type}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{a.description}</p>
                </div>
                <span className="text-[10px] text-slate-600 whitespace-nowrap pt-0.5">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Architecture */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">API Architecture</p>
              <p className="section-sub mt-0.5">Live service status</p>
            </div>
            <span className="text-[10px] text-slate-600 font-mono">{apis.length} services</span>
          </div>
          <div className="space-y-2">
            {apis.map((api) => (
              <div key={api.name}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    api.status === 'healthy' ? 'bg-success' : api.status === 'degraded' ? 'bg-warning' : 'bg-danger'
                  } animate-pulse`} />
                  <span className="text-[13px] text-slate-300 font-medium">{api.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">{api.latency}ms</span>
                  <StatusBadge status={api.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
