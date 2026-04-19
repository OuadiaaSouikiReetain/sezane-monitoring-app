import { GitBranch, Cog, AlertCircle, Users } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { KpiCard } from './kpi-card'
import { HealthChart } from './health-chart'
import { IncidentSummary } from './incident-summary'
import { StatusBadge } from '@/shared/components/ui'
import { useActivityChart, useOverviewAnomalies, useOverviewApis } from '../hooks/use-overview'
import { useSfmcOverview } from '../hooks/use-sfmc-overview'
import { activityChartData as mockActivity, anomalies as mockAnomalies, apis as mockApis } from '@/mocks/data'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  labelStyle: { color: '#6B7280', fontWeight: 600 },
  itemStyle: { color: '#111827' },
}

const FALLBACK_HEALTH = [
  { name: 'Healthy',  value: 189, color: '#059669' },
  { name: 'Degraded', value: 26,  color: '#D97706' },
  { name: 'Critical', value: 14,  color: '#DC2626' },
]

export function OverviewPage() {
  const sfmc                 = useSfmcOverview()
  const { data: activity }   = useActivityChart()
  const { data: anomalies }  = useOverviewAnomalies()
  const { data: apiHealth }  = useOverviewApis()

  const activityData = activity ?? mockActivity
  const anomalyData  = anomalies ?? mockAnomalies
  const apis         = apiHealth ?? mockApis

  const healthData = sfmc.isLoading ? FALLBACK_HEALTH : [
    { name: 'Healthy',  value: sfmc.journeys.healthy  + sfmc.automations.healthy,  color: '#059669' },
    { name: 'Degraded', value: sfmc.journeys.degraded + sfmc.automations.degraded, color: '#D97706' },
    { name: 'Critical', value: sfmc.journeys.critical + sfmc.automations.critical, color: '#DC2626' },
  ]

  return (
    <div className="space-y-5 animate-slide-up">

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Active Journeys"
          value={sfmc.isLoading ? '…' : sfmc.journeys.total}
          icon={GitBranch}
          color="neutral"
          sub={sfmc.isLoading ? 'Loading…' : `${sfmc.journeys.healthy} healthy · ${sfmc.journeys.critical} critical`}
        />
        <KpiCard
          title="Automations"
          value={sfmc.isLoading ? '…' : sfmc.automations.total}
          icon={Cog}
          color="green"
          sub={sfmc.isLoading ? 'Loading…' : `${sfmc.automations.healthy} healthy · ${sfmc.automations.critical} critical`}
        />
        <KpiCard
          title="Contacts in Journey"
          value={sfmc.isLoading ? '…' : sfmc.population.current.toLocaleString()}
          icon={Users}
          color="amber"
          sub={sfmc.isLoading ? 'Loading…' : `${sfmc.population.cumulative.toLocaleString()} cumulative entries`}
        />
        <KpiCard
          title="Critical Items"
          value={sfmc.isLoading ? '…' : sfmc.journeys.critical + sfmc.automations.critical}
          icon={AlertCircle}
          color="red"
          sub={sfmc.isLoading ? 'Loading…' : `${sfmc.journeys.critical} journeys · ${sfmc.automations.critical} automations`}
        />
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
            <div className="flex gap-4 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-[2px] rounded-full bg-ink inline-block" />
                Success
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-[2px] rounded-full bg-danger inline-block" />
                Failures
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={activityData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#111827" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="success"  stroke="#111827" strokeWidth={1.5} fill="url(#gSuccess)" />
              <Area type="monotone" dataKey="failures" stroke="#DC2626" strokeWidth={1.5} fill="url(#gFail)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Health Donut */}
        <HealthChart data={healthData} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        <IncidentSummary anomalies={anomalyData} />

        {/* API Architecture */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">API Architecture</p>
              <p className="section-sub mt-0.5">Live service status</p>
            </div>
            <span className="text-[10px] text-ink-muted font-mono">{apis.length} services</span>
          </div>
          <div className="space-y-2">
            {apis.map((api) => (
              <div
                key={api.name}
                className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border hover:bg-elevated transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${
                      api.status === 'healthy' ? 'bg-success' : api.status === 'degraded' ? 'bg-warning' : 'bg-danger'
                    }`}
                  />
                  <span className="text-[13px] text-ink-sub font-medium">{api.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-ink-muted font-mono">{api.latency}ms</span>
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
