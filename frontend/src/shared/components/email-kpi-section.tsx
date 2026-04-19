/**
 * EmailKpiSection
 * ───────────────
 * Affiche les KPIs email (open rate, CTR, bounce rate, etc.) dans un
 * panneau compact. Utilisé dans les drawers Automation et Journey.
 *
 * Props :
 *   data      → EmailKpiData retourné par /api/{journeys|automations}/{id}/kpis/
 *   isLoading → affiche un skeleton
 *   isError   → affiche un message d'erreur
 */

import { Mail, TrendingUp, TrendingDown, Minus, AlertTriangle, MousePointerClick } from 'lucide-react'

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface EmailKpiData {
  sent:               number
  delivered:          number
  opens:              number
  unique_opens:       number
  clicks:             number
  unique_clicks:      number
  bounces:            number
  hard_bounces:       number
  soft_bounces:       number
  unsubscribes:       number
  open_rate:          number
  ctr:                number
  bounce_rate:        number
  delivery_rate:      number
  unsubscribe_rate:   number
  open_rate_status:        'healthy' | 'warn' | 'critical' | 'unknown'
  ctr_status:              'healthy' | 'warn' | 'critical' | 'unknown'
  bounce_rate_status:      'healthy' | 'warn' | 'critical' | 'unknown'
  delivery_rate_status:    'healthy' | 'warn' | 'critical' | 'unknown'
  unsubscribe_rate_status: 'healthy' | 'warn' | 'critical' | 'unknown'
  data_available:     boolean
  source?:            string
  days_back?:         number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type RateStatus = EmailKpiData['open_rate_status']

function fmt(n?: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtPct(n?: number | null): string {
  if (n == null) return '—'
  return `${n.toFixed(2)}%`
}

function textColor(s: RateStatus) {
  if (s === 'healthy')  return 'text-emerald-600'
  if (s === 'warn')     return 'text-amber-600'
  if (s === 'critical') return 'text-red-600'
  return 'text-ink-muted'
}

function barColor(s: RateStatus) {
  if (s === 'healthy')  return 'bg-emerald-500'
  if (s === 'warn')     return 'bg-amber-500'
  if (s === 'critical') return 'bg-red-500'
  return 'bg-border-strong'
}

function StatusIcon({ s }: { s: RateStatus }) {
  if (s === 'healthy')  return <TrendingUp  size={10} className="text-emerald-600 shrink-0" />
  if (s === 'critical') return <TrendingDown size={10} className="text-red-600 shrink-0" />
  if (s === 'warn')     return <AlertTriangle size={10} className="text-amber-600 shrink-0" />
  return <Minus size={10} className="text-ink-faint shrink-0" />
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ label, value, rate, status, barMax = 100 }: {
  label:   string
  value:   string
  rate:    string
  status:  RateStatus
  barMax?: number
}) {
  const pct      = parseFloat(rate) || 0
  const barWidth = Math.min((pct / barMax) * 100, 100)

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border-light last:border-0">
      <span className="text-[11px] text-ink-muted w-28 shrink-0">{label}</span>
      <span className="text-[12px] font-mono font-semibold text-ink-sub w-14 shrink-0 text-right">
        {value}
      </span>
      <div className="flex-1 h-1 bg-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(status)}`}
          style={{ width: `${barWidth}%`, opacity: 0.75 }}
        />
      </div>
      <span className={`text-[11px] font-mono w-11 text-right shrink-0 ${textColor(status)}`}>
        {rate}
      </span>
      <StatusIcon s={status} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EmailKpiSectionProps {
  data?:      EmailKpiData | null
  isLoading?: boolean
  isError?:   boolean
}

export function EmailKpiSection({ data, isLoading = false, isError = false }: EmailKpiSectionProps) {
  const days = data?.days_back ?? 30

  return (
    <div className="px-6 py-5 border-b border-border">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted flex items-center gap-1.5">
          <Mail size={11} />
          Email Performance
        </p>
        <span className="text-[10px] text-ink-faint bg-elevated border border-border px-2 py-0.5 rounded-full">
          {days}j
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className="h-2 bg-elevated rounded w-24 shrink-0" />
              <div className="h-2 bg-elevated rounded w-12 shrink-0" />
              <div className="flex-1 h-1 bg-border rounded-full" />
              <div className="h-2 bg-elevated rounded w-10 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <p className="text-[11px] text-ink-muted italic py-3 text-center">
          Statistiques email indisponibles
        </p>
      )}

      {/* No email activities (different from no data) */}
      {!isLoading && !isError && data && data.source === 'no_email_activities' && (
        <div className="flex flex-col items-center gap-1.5 py-5">
          <MousePointerClick size={18} className="text-ink-faint" />
          <p className="text-[11px] text-ink-muted">
            Aucune activité email dans ce composant
          </p>
        </div>
      )}

      {/* Data (always display if we have data object, regardless of data_available) */}
      {!isLoading && !isError && data && data.source !== 'no_email_activities' && (
        <>
          {/* Volume pills */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {([
              { label: 'Envoyés',   value: fmt(data.sent),      status: 'healthy'             },
              { label: 'Délivrés',  value: fmt(data.delivered), status: data.delivery_rate_status },
              { label: 'Bounces',   value: fmt(data.bounces),   status: data.bounce_rate_status   },
            ] as const).map(({ label, value, status }) => (
              <div key={label} className={`
                rounded-xl p-2.5 border text-center
                ${status === 'critical' ? 'bg-danger-bg border-danger-border'
                : status === 'warn'     ? 'bg-warning-bg border-warning-border'
                :                         'bg-bg border-border'}
              `}>
                <p className="text-[15px] font-bold text-ink leading-none">{value}</p>
                <p className="text-[9px] text-ink-muted uppercase tracking-wide mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Taux */}
          <MetricRow label="Délivrabilité"   value={fmt(data.delivered)}    rate={fmtPct(data.delivery_rate)}    status={data.delivery_rate_status}    barMax={100} />
          <MetricRow label="Taux d'ouverture" value={fmt(data.unique_opens)} rate={fmtPct(data.open_rate)}        status={data.open_rate_status}        barMax={60}  />
          <MetricRow label="Taux de clic"     value={fmt(data.unique_clicks)} rate={fmtPct(data.ctr)}             status={data.ctr_status}              barMax={20}  />
          <MetricRow label="Taux de rebond"   value={fmt(data.bounces)}      rate={fmtPct(data.bounce_rate)}      status={data.bounce_rate_status}      barMax={10}  />
          <MetricRow label="Désabonnements"   value={fmt(data.unsubscribes)} rate={fmtPct(data.unsubscribe_rate)} status={data.unsubscribe_rate_status} barMax={2}   />

          {/* Détail hard/soft bounce */}
          {(data.hard_bounces > 0 || data.soft_bounces > 0) && (
            <p className="text-[10px] text-ink-faint mt-2">
              Hard : {fmt(data.hard_bounces)} · Soft : {fmt(data.soft_bounces)}
            </p>
          )}
        </>
      )}
    </div>
  )
}
