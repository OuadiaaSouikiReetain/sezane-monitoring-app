export const kpiData = {
  journeys: { total: 142, healthy: 118, degraded: 16, critical: 8 },
  automations: { total: 87, healthy: 71, degraded: 10, critical: 6 },
  incidents: { open: 23, resolved: 187, mttr: '14m' },
  apiLatency: { avg: 124, p95: 340, p99: 720 },
}

export const journeys = [
  { id: 1, name: 'Welcome Series — FR', bu: 'France', owner: 'Sophie M.', status: 'healthy', entries: 4820, sla: 99.2, anomalies: 0 },
  { id: 2, name: 'Abandoned Cart Recovery', bu: 'Belgium', owner: 'Marc D.', status: 'degraded', entries: 2310, sla: 94.7, anomalies: 2 },
  { id: 3, name: 'Post-Purchase Nurture', bu: 'France', owner: 'Julie K.', status: 'healthy', entries: 6540, sla: 99.8, anomalies: 0 },
  { id: 4, name: 'Win-Back Campaign', bu: 'Germany', owner: 'Hans W.', status: 'critical', entries: 890, sla: 78.3, anomalies: 5 },
  { id: 5, name: 'Loyalty Rewards Flow', bu: 'Spain', owner: 'Elena R.', status: 'healthy', entries: 3210, sla: 98.1, anomalies: 0 },
  { id: 6, name: 'Birthday Trigger', bu: 'France', owner: 'Sophie M.', status: 'degraded', entries: 1450, sla: 91.2, anomalies: 1 },
  { id: 7, name: 'Onboarding Journey', bu: 'UK', owner: 'James T.', status: 'healthy', entries: 7830, sla: 99.5, anomalies: 0 },
  { id: 8, name: 'Re-engagement Flow', bu: 'Italy', owner: 'Luca B.', status: 'critical', entries: 560, sla: 72.1, anomalies: 4 },
]

export const automations = [
  { id: 1, name: 'Daily Data Import', frequency: 'Daily 02:00', lastRun: '2m ago', duration: '4m 12s', status: 'healthy', delay: false },
  { id: 2, name: 'Segment Refresh — VIP', frequency: 'Every 4h', lastRun: '1h ago', duration: '12m 34s', status: 'degraded', delay: true },
  { id: 3, name: 'Email Send — Newsletter', frequency: 'Weekly Mon', lastRun: '2d ago', duration: '8m 02s', status: 'healthy', delay: false },
  { id: 4, name: 'Journey Entry Update', frequency: 'Every 30min', lastRun: '18m ago', duration: '1m 45s', status: 'critical', delay: true },
  { id: 5, name: 'Data Extension Purge', frequency: 'Monthly', lastRun: '12d ago', duration: '22m 10s', status: 'healthy', delay: false },
  { id: 6, name: 'Analytics Export', frequency: 'Daily 06:00', lastRun: '3h ago', duration: '6m 55s', status: 'healthy', delay: false },
  { id: 7, name: 'Suppression List Sync', frequency: 'Every 6h', lastRun: '5h ago', duration: '3m 20s', status: 'degraded', delay: true },
]

export const apis = [
  { name: 'Auth API', latency: 42, p95: 110, successRate: 99.9, status: 'healthy', uptime: '99.99%' },
  { name: 'Journey API', latency: 187, p95: 420, successRate: 97.2, status: 'degraded', uptime: '99.4%' },
  { name: 'Automation API', latency: 95, p95: 230, successRate: 98.8, status: 'healthy', uptime: '99.7%' },
  { name: 'Analytics API', latency: 340, p95: 890, successRate: 94.1, status: 'critical', uptime: '97.2%' },
  { name: 'Alerting API', latency: 58, p95: 140, successRate: 99.5, status: 'healthy', uptime: '99.9%' },
]

export const anomalies = [
  { id: 1, type: 'Automation Delay', description: 'Journey Entry Update exceeded 30min threshold by 18min', severity: 'critical', impact: 'High — 2,310 contacts delayed', time: '12m ago', journey: 'Abandoned Cart Recovery' },
  { id: 2, type: 'API Timeout', description: 'Analytics API p95 latency > 800ms for last 45min', severity: 'critical', impact: 'Medium — Analytics dashboards degraded', time: '47m ago', journey: null },
  { id: 3, type: 'Journey Drop', description: 'Win-Back Campaign entry rate dropped 67% vs last week', severity: 'critical', impact: 'High — Revenue impact estimated', time: '2h ago', journey: 'Win-Back Campaign' },
  { id: 4, type: 'KPI Anomaly', description: 'SLA below 80% threshold on Re-engagement Flow', severity: 'critical', impact: 'High — SLA breach', time: '3h ago', journey: 'Re-engagement Flow' },
  { id: 5, type: 'Automation Delay', description: 'Segment Refresh VIP delayed by 40min', severity: 'degraded', impact: 'Medium — Segment data stale', time: '1h ago', journey: null },
  { id: 6, type: 'Journey Drop', description: 'Birthday Trigger open rate below 15% threshold', severity: 'degraded', impact: 'Low — Engagement impact', time: '4h ago', journey: 'Birthday Trigger' },
]

export const alerts = [
  { id: 1, title: 'Analytics API SLA Breach', severity: 'critical', recipient: 'ops-team@company.com', channel: 'Slack + Email', escalated: true, time: '47m ago', status: 'open' },
  { id: 2, title: 'Win-Back Journey Critical Drop', severity: 'critical', recipient: 'marketing-lead@company.com', channel: 'Email + SMS', escalated: true, time: '2h ago', status: 'open' },
  { id: 3, title: 'Journey Entry Update Timeout', severity: 'critical', recipient: 'tech-oncall@company.com', channel: 'PagerDuty', escalated: false, time: '12m ago', status: 'open' },
  { id: 4, title: 'VIP Segment Refresh Delay', severity: 'degraded', recipient: 'crm-team@company.com', channel: 'Slack', escalated: false, time: '1h ago', status: 'acknowledged' },
  { id: 5, title: 'Birthday Trigger Engagement Drop', severity: 'degraded', recipient: 'content@company.com', channel: 'Email', escalated: false, time: '4h ago', status: 'acknowledged' },
  { id: 6, title: 'Daily Data Import Slow', severity: 'info', recipient: 'data-team@company.com', channel: 'Slack', escalated: false, time: '1d ago', status: 'resolved' },
]

export const activityChartData = [
  { time: '00:00', success: 1200, failures: 12 },
  { time: '02:00', success: 890, failures: 8 },
  { time: '04:00', success: 640, failures: 5 },
  { time: '06:00', success: 980, failures: 14 },
  { time: '08:00', success: 2340, failures: 32 },
  { time: '10:00', success: 3120, failures: 45 },
  { time: '12:00', success: 2890, failures: 28 },
  { time: '14:00', success: 3450, failures: 67 },
  { time: '16:00', success: 3780, failures: 89 },
  { time: '18:00', success: 2960, failures: 52 },
  { time: '20:00', success: 2100, failures: 23 },
  { time: '22:00', success: 1540, failures: 18 },
]

export const analyticsKpis = [
  { label: 'Email Success Rate', value: '97.4%', trend: '+0.3%', up: true },
  { label: 'Delivery Rate', value: '99.1%', trend: '+0.1%', up: true },
  { label: 'MTTR', value: '14m', trend: '-3m', up: true },
  { label: 'Journey Completion', value: '84.2%', trend: '-1.2%', up: false },
]

export const performanceTrend = [
  { week: 'W1', successRate: 96.8, deliveryRate: 98.9, sla: 94.2 },
  { week: 'W2', successRate: 97.1, deliveryRate: 99.0, sla: 95.1 },
  { week: 'W3', successRate: 96.5, deliveryRate: 98.7, sla: 93.8 },
  { week: 'W4', successRate: 97.4, deliveryRate: 99.1, sla: 96.3 },
  { week: 'W5', successRate: 97.8, deliveryRate: 99.2, sla: 96.8 },
  { week: 'W6', successRate: 97.4, deliveryRate: 99.1, sla: 95.9 },
]

export const settingsRules = [
  { id: 1, name: 'Journey SLA Threshold', type: 'SLA', value: '< 90%', action: 'Alert + Escalate', active: true },
  { id: 2, name: 'API Latency P95', type: 'Threshold', value: '> 500ms', action: 'Alert Ops Team', active: true },
  { id: 3, name: 'Automation Delay', type: 'Threshold', value: '> 15min', action: 'Alert + Log', active: true },
  { id: 4, name: 'Journey Entry Drop', type: 'Anomaly', value: '> 50% drop', action: 'Alert Marketing Lead', active: false },
  { id: 5, name: 'Error Rate Spike', type: 'Anomaly', value: '> 5%', action: 'PagerDuty', active: true },
]
