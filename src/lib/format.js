export function formatValue(value, unitType) {
  if (value === null || value === undefined) return '—'
  switch (unitType) {
    case 'percent':
      return `${Number(value).toFixed(0)}%`
    case 'days':
      return `${Number(value).toFixed(2)} days`
    case 'hours':
      return `${Number(value).toFixed(2)} hrs`
    case 'count':
      return Math.round(value).toString()
    default:
      return typeof value === 'number' ? Number(value).toFixed(2) : String(value)
  }
}

export function formatTarget(value, unitType) {
  if (value === null || value === undefined) return '—'
  switch (unitType) {
    case 'percent':
      return `${Number(value) % 1 === 0 ? Number(value).toFixed(0) : Number(value).toFixed(1)}%`
    case 'days':
      return `${Number(value)} days`
    case 'count':
      return Math.round(value).toString()
    default:
      return String(value)
  }
}

export function formatTolerance(value, unit, unitType) {
  if (value === null || value === undefined) return '—'
  const label = unit === 'points' ? 'pts' : (unit || unitType || '')
  return `±${value} ${label}`.trim()
}

export function statusLabel(metricStatus) {
  const map = {
    on_track:  'On Track',
    off_track: 'Off Track',
    no_target: 'No Goal',
    no_goal:   'No Goal',
    no_data:   'No Data',
  }
  return map[metricStatus] ?? metricStatus
}

export function statusClass(metricStatus) {
  const map = {
    on_track:  'status-on-track',
    off_track: 'status-off-track',
    no_target: 'status-no-goal',
    no_goal:   'status-no-goal',
    no_data:   'status-no-data',
  }
  return map[metricStatus] ?? ''
}

export function ratingClass(ratingLabel) {
  if (!ratingLabel) return ''
  const lower = ratingLabel.toLowerCase()
  if (lower.includes('exceeds')) return 'rating-exceeds'
  if (lower.includes('meets')) return 'rating-meets'
  if (lower.includes('improvement')) return 'rating-needs-improvement'
  if (lower.includes('below')) return 'rating-below'
  if (lower.includes('incomplete')) return 'rating-incomplete'
  return ''
}

// Returns YYYY-MM for current month
export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Returns list of last N months as { value: 'YYYY-MM', label: 'Month YYYY' }
export function recentMonths(n = 12) {
  const months = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const value = `${year}-${String(month).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    months.push({ value, label })
    d.setMonth(d.getMonth() - 1)
  }
  return months
}
