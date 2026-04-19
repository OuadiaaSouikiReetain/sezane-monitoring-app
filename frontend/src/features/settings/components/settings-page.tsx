import { useState } from 'react'
import { Plus, Shield, Activity, Clock, ArrowRight, Zap } from 'lucide-react'
import { settingsRules as mockRules } from '@/mocks/data'
import type { SettingsRule } from '@/entities/kpi/model'
import type { ElementType } from 'react'

const TYPE_META: Record<string, { icon: ElementType; color: string; label_cls: string }> = {
  SLA: {
    icon: Shield,
    color: 'text-info bg-info-bg border-info-border',
    label_cls: 'bg-info-bg text-info border-info-border',
  },
  Threshold: {
    icon: Activity,
    color: 'text-warning bg-warning-bg border-warning-border',
    label_cls: 'bg-warning-bg text-warning border-warning-border',
  },
  Anomaly: {
    icon: Clock,
    color: 'text-ink-muted bg-elevated border-border',
    label_cls: 'bg-elevated text-ink-muted border-border',
  },
}

const ESCALATION = [
  { level: 'L1', label: 'Ops Team Alert',       time: 'Immediate', channel: 'Slack',        cls: 'bg-elevated border-border text-ink-muted' },
  { level: 'L2', label: 'Tech Lead Escalation', time: '15 min',    channel: 'PagerDuty',    cls: 'bg-warning-bg border-warning-border text-warning' },
  { level: 'L3', label: 'Management Notify',    time: '45 min',    channel: 'Email + SMS',  cls: 'bg-danger-bg border-danger-border text-danger' },
]

export function SettingsPage() {
  const [rules, setRules] = useState<SettingsRule[]>(mockRules)

  const toggle = (id: number) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))

  const active   = rules.filter((r) => r.active).length
  const inactive = rules.filter((r) => !r.active).length

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-ink-muted">
            Manage monitoring thresholds, SLA rules, and escalation policies.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={14} />
          Add Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { v: active,        label: 'Active Rules',   cls: 'text-success',  bg: 'bg-success-bg border-success-border' },
          { v: inactive,      label: 'Inactive Rules', cls: 'text-ink-muted', bg: '' },
          { v: rules.length,  label: 'Total Rules',    cls: 'text-ink',      bg: '' },
        ].map(({ v, label, cls, bg }) => (
          <div key={label} className={`card rounded-2xl p-5 border ${bg || 'border-border'}`}>
            <p className={`text-3xl font-bold leading-none tracking-tight ${cls}`}>{v}</p>
            <p className="text-[12px] text-ink-muted mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Rules List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="section-title">Monitoring Rules</p>
          <span className="section-sub">{active} active</span>
        </div>
        <div className="divide-y divide-border-light">
          {rules.map((rule) => {
            const meta = TYPE_META[rule.type] ?? TYPE_META.Threshold
            const Icon = meta.icon
            return (
              <div
                key={rule.id}
                className={`px-5 py-4 flex items-center gap-4 transition-colors hover:bg-elevated ${
                  rule.active ? '' : 'opacity-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${meta.color}`}>
                  <Icon size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-ink">{rule.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.label_cls}`}>
                      {rule.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Trigger:{' '}
                    <span className="text-ink-sub font-semibold font-mono">{rule.value}</span>
                    <span className="mx-2 text-ink-faint">·</span>
                    Action:{' '}
                    <span className="text-ink-sub">{rule.action}</span>
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(rule.id)}
                  aria-label={rule.active ? 'Deactivate rule' : 'Activate rule'}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0
                    focus:outline-none focus:ring-2 focus:ring-ink/20 ${
                      rule.active ? 'bg-ink' : 'bg-border-strong'
                    }`}
                >
                  <span
                    className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-md transition-all duration-300 ${
                      rule.active ? 'left-[22px]' : 'left-[3px]'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-2 gap-4">
        {/* SLA Config */}
        <div className="card p-5">
          <p className="section-title mb-4">SLA Configuration</p>
          <div className="space-y-2">
            {[
              { label: 'Journey SLA Target',       value: '95%',    cls: 'text-success' },
              { label: 'API Success Rate Target',   value: '99%',    cls: 'text-success' },
              { label: 'Automation Max Delay',      value: '15 min', cls: 'text-warning' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 bg-bg rounded-xl border border-border hover:bg-elevated transition-colors"
              >
                <span className="text-[12px] text-ink-muted">{item.label}</span>
                <span className={`text-[13px] font-bold font-mono ${item.cls}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation Policy */}
        <div className="card p-5">
          <p className="section-title mb-4">Escalation Policy</p>
          <div className="space-y-2">
            {ESCALATION.map((e, i) => (
              <div
                key={e.level}
                className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border"
              >
                <span
                  className={`w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center flex-shrink-0 border ${e.cls}`}
                >
                  {e.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-ink">{e.label}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {e.time} · {e.channel}
                  </p>
                </div>
                {i < ESCALATION.length - 1 && (
                  <ArrowRight size={12} className="text-ink-faint flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 p-3 bg-elevated border border-border rounded-xl">
            <Zap size={13} className="text-ink-muted" />
            <p className="text-[11px] text-ink-muted">
              Auto-escalation enabled after threshold breach
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
