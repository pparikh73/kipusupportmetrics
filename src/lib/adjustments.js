// APT-88: Per-agent metric adjustments (custom goal / exclude), stored inside
// the monthly supervisor note behind a marker so no schema change is needed.
// Format, one line per metric after the marker:
//   metric_key | exclude | reason=... | by=...
//   metric_key | goal=80 | tolerance=5 | reason=... | by=...
export const ADJ_MARKER = '[[ADJUSTMENTS]]'

export function parseNoteAdjustments(noteText) {
  const text = noteText ?? ''
  const idx = text.indexOf(ADJ_MARKER)
  if (idx === -1) return { cleanNote: text, adjustments: {} }
  const cleanNote = text.slice(0, idx).replace(/\s+$/, '')
  const adjustments = {}
  text.slice(idx + ADJ_MARKER.length).split('\n').forEach((line) => {
    const parts = line.split('|').map((s) => s.trim())
    if (parts.length < 2 || !parts[0]) return
    const adj = { metric_key: parts[0] }
    parts.slice(1).forEach((p) => {
      if (p === 'exclude') adj.exclude = true
      const m = p.match(/^(goal|tolerance|reason|by)=(.*)$/)
      if (m) adj[m[1]] = (m[1] === 'goal' || m[1] === 'tolerance') ? Number(m[2]) : m[2]
    })
    adjustments[parts[0]] = adj
  })
  return { cleanNote, adjustments }
}

export function serializeNoteWithAdjustments(cleanNote, adjustments) {
  const noteBody = (cleanNote ?? '').replace(/\s+$/, '')
  const entries = Object.values(adjustments ?? {})
  if (!entries.length) return noteBody
  const lines = entries.map((a) => {
    const parts = [a.metric_key]
    if (a.exclude) parts.push('exclude')
    else {
      if (a.goal != null) parts.push(`goal=${a.goal}`)
      if (a.tolerance != null) parts.push(`tolerance=${a.tolerance}`)
    }
    if (a.reason) parts.push(`reason=${a.reason}`)
    if (a.by) parts.push(`by=${a.by}`)
    return parts.join(' | ')
  })
  return `${noteBody}\n\n${ADJ_MARKER}\n${lines.join('\n')}`.replace(/^\n+/, '')
}

// Human-readable one-liner for an adjustment, e.g. "Custom goal: 80 (±5)"
export function describeAdjustment(adj) {
  if (adj.exclude) return 'Excluded from score'
  const tol = adj.tolerance != null ? ` (±${adj.tolerance})` : ''
  return `Custom goal: ${adj.goal}${tol}`
}
