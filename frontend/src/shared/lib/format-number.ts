export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatPercent(value: number): string {
  // Accepts either 0.974 or 97.4 — detect by magnitude
  const pct = value <= 1 ? value * 100 : value
  return `${pct.toFixed(1)}%`
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
