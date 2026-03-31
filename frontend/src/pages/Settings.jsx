import { useState } from 'react'
import { settingsRules } from '../data/mockData'
import { Plus, Shield, Activity, Clock, ArrowRight, Zap } from 'lucide-react'

const TYPE_META = {
  SLA:       { icon: Shield,   color: 'text-info    bg-info/10    border-info/20',    label_cls: 'bg-info/10    text-info    border-info/20'    },
  Threshold: { icon: Activity, color: 'text-warning bg-warning/10 border-warning/20', label_cls: 'bg-warning/10 text-warning border-warning/20' },
  Anomaly:   { icon: Clock,    color: 'text-primary-light bg-primary/10 border-primary/20', label_cls: 'bg-primary/10 text-primary-light border-primary/20' },
}

const ESCALATION = [
  { level: 'L1', label: 'Ops Team Alert',     time: 'Immediate', channel: 'Slack',       cls: 'bg-primary/10 border-primary/25 text-primary-light' },
  { level: 'L2', label: 'Tech Lead Escalation', time: '15 min',  channel: 'PagerDuty',   cls: 'bg-warning/10 border-warning/25 text-warning' },
  { level: 'L3', label: 'Management Notify',  time: '45 min',    channel: 'Email + SMS', cls: 'bg-danger/10  border-danger/25  text-danger' },
]

export default function Settings() {
  const [rules, setRules] = useState(settingsRules)

  const toggle = (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))

  const active   = rules.filter(r => r.active).length
  const inactive = rules.filter(r => !r.active).length

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-400">Manage monitoring thresholds, SLA rules, and escalation policies.</p>
        </div>
        <button className="btn-primary">
          <Plus size={14} />
          Add Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { v: active,   label: 'Active Rules',   cls: 'text-success', bg: 'bg-success/[0.06] border-success/20' },
          { v: inactive, label: 'Inactive Rules',  cls: 'text-slate-500', bg: '' },
          { v: rules.length, label: 'Total Rules', cls: 'text-white',  bg: '' },
        ].map(({ v, label, cls, bg }) => (
          <div key={label} className={`card-hover rounded-2xl p-5 border ${bg || 'border-white/[0.06]'}`}>
            <p className={`text-3xl font-bold leading-none tracking-tight ${cls}`}>{v}</p>
            <p className="text-[12px] text-slate-500 mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Rules List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="section-title">Monitoring Rules</p>
          <span className="section-sub">{active} active</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rules.map((rule) => {
            const meta = TYPE_META[rule.type] || TYPE_META.Threshold
            const Icon = meta.icon
            return (
              <div key={rule.id}
                className={`px-5 py-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]
                  ${rule.active ? '' : 'opacity-50'}`}>

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${meta.color}`}>
                  <Icon size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-slate-200">{rule.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.label_cls}`}>
                      {rule.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Trigger:{' '}
                    <span className="text-slate-400 font-semibold font-mono">{rule.value}</span>
                    <span className="mx-2 text-slate-700">·</span>
                    Action:{' '}
                    <span className="text-slate-400">{rule.action}</span>
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(rule.id)}
                  aria-label={rule.active ? 'Deactivate rule' : 'Activate rule'}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0
                    focus:outline-none focus:ring-2 focus:ring-primary/40
                    ${rule.active
                      ? 'bg-primary shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                      : 'bg-white/[0.08]'
                    }`}
                >
                  <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-md
                    transition-all duration-300 ${rule.active ? 'left-[22px]' : 'left-[3px]'}`} />
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
              { label: 'Journey SLA Target',         value: '95%',   cls: 'text-success' },
              { label: 'API Success Rate Target',     value: '99%',   cls: 'text-success' },
              { label: 'Automation Max Delay',        value: '15 min',cls: 'text-warning' },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                <span className="text-[12px] text-slate-400">{item.label}</span>
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
              <div key={e.level} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <span className={`w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center flex-shrink-0 border ${e.cls}`}>
                  {e.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-200">{e.label}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{e.time} · {e.channel}</p>
                </div>
                {i < ESCALATION.length - 1 && (
                  <ArrowRight size={12} className="text-slate-700 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 p-3 bg-primary/[0.06] border border-primary/20 rounded-xl">
            <Zap size={13} className="text-primary-light" />
            <p className="text-[11px] text-primary/80">Auto-escalation enabled after threshold breach</p>
          </div>
        </div>
      </div>
    </div>
  )
}
