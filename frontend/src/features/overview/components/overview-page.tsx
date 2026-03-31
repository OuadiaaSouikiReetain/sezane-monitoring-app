import { GitBranch, Cog, AlertCircle, Zap } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { KpiCard } from './kpi-card'
import { HealthChart } from './health-chart'
import { IncidentSummary } from './incident-summary'
import { StatusBadge } from '@/shared/components/ui'
import { useOverviewKpis, useActivityChart, useOverviewAnomalies, useOverviewApis } from '../hooks/use-overview'
import { mapKpiToHealthData } from '../utils/overview.mapper'
import { kpiData as mockKpis, activityChartData as mockActivity, anomalies as mockAnomalies, apis as mockApis } from '@/mocks/data'

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

const FALLBACK_HEALTH = [
  { name: 'Healthy',  value: 189, color: '#22C55E' },
  { name: 'Degraded', value: 26,  color: '#F59E0B' },
  { name: 'Critical', value: 14,  color: '#EF4444' },
]

export function OverviewPage() {
  const { data: kpis }      = useOverviewKpis()
  const { data: activity }  = useActivityChart()
  const { data: anomalies } = useOverviewAnomalies()
  const { data: apiHealth } = useOverviewApis()

  const kpi          = kpis ?? mockKpis
  const activityData = activity ?? mockActivity
  const anomalyData  = anomalies ?? mockAnomalies
  const apis         = apiHealth ?? mockApis

  const healthData = kpis ? mapKpiToHealthData(kpis) : FALLBACK_HEALTH

  return (
    <div className="space-y-5 animate-slide-up">

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Active Journeys"
          value={kpi.journeys.total}
          icon={GitBranch}
          color="indigo"
          trend="+4"
          sub={`${kpi.journeys.healthy} healthy · ${kpi.journeys.critical} critical`}
        />
        <KpiCard
          title="Automations"
          value={kpi.automations.total}
          icon={Cog}
          color="green"
          trend="+1"
          sub={`${kpi.automations.healthy} healthy · ${kpi.automations.critical} critical`}
        />
        <KpiCard
          title="Open Incidents"
          value={kpi.incidents.open}
          icon={AlertCircle}
          color="red"
          trend="-2"
          sub={`MTTR: ${kpi.incidents.mttr} · ${kpi.incidents.resolved} resolved`}
        />
        <KpiCard
          title="Avg API Latency"
          value={`${kpi.apiLatency.avg}ms`}
          icon={Zap}
          color="amber"
          trend="+8ms"
          sub={`P95: ${kpi.apiLatency.p95}ms · P99: ${kpi.apiLatency.p99}ms`}
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
            <AreaChart data={activityData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
              <Area type="monotone" dataKey="success"  stroke="#6366F1" strokeWidth={2} fill="url(#gSuccess)" />
              <Area type="monotone" dataKey="failures" stroke="#EF4444" strokeWidth={2} fill="url(#gFail)" />
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
            <span className="text-[10px] text-slate-600 font-mono">{apis.length} services</span>
          </div>
          <div className="space-y-2">
            {apis.map((api) => (
              <div
                key={api.name}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${
                      api.status === 'healthy' ? 'bg-success' : api.status === 'degraded' ? 'bg-warning' : 'bg-danger'
                    }`}
                  />
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
