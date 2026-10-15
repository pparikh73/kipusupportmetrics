// APT-145: the date rules behind goals, kept free of any database code so they
// can be reasoned about — and tested — on their own.
//
// Reports read whichever goal was in force for the month being shown. Two goals
// covering the same dates therefore leave a report with no way to choose, which
// is what the Goals page warns about.

// 'YYYY-MM-DD' shifted by n days, without tripping over time zones
export function shiftDay(iso, n) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

// A goal counts for a given day when it is switched on, has started, and has
// not ended. A blank start or end date means open-ended in that direction.
export function runsOn(goal, day) {
  if (!goal.active) return false
  if (goal.effective_start_month && goal.effective_start_month > day) return false
  if (goal.effective_end_month && goal.effective_end_month < day) return false
  return true
}

// Whether two goals cover any of the same dates
export function overlaps(a, b) {
  const startA = a.effective_start_month || '0000-01-01'
  const endA   = a.effective_end_month   || '9999-12-31'
  const startB = b.effective_start_month || '0000-01-01'
  const endB   = b.effective_end_month   || '9999-12-31'
  return startA <= endB && startB <= endA
}
