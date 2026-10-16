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

/**
 * Works out what has to change when a goal is applied to a team, so that the
 * new goal takes over cleanly from whatever is running and no two goals ever
 * cover the same dates.
 *
 * @param goals     every goal row for ONE team and ONE metric
 * @param startDate 'YYYY-MM-DD' the new goal starts
 * @returns { correct, toEnd, insertEnd }
 *   correct    — an existing row to amend in place instead of adding a new one
 *   toEnd      — rows to close off, each { id, endDate }
 *   insertEnd  — end date for the new row (null = open-ended)
 */
export function planGoalChange(goals, startDate) {
  const live = goals
    .filter((g) => g.active)
    .filter((g) => !g.effective_end_month || g.effective_end_month >= startDate)

  // A goal already starting on this exact day is corrected, not duplicated:
  // two rows starting the same day leave reports with no way to choose.
  const correct = live.find((g) => (g.effective_start_month ?? '') === startDate)
  if (correct) return { correct, toEnd: [], insertEnd: null }

  // Close whatever is running, the day before the new goal takes over
  const toEnd = live
    .filter((g) => (g.effective_start_month ?? '') < startDate)
    .map((g) => ({ id: g.id, endDate: shiftDay(startDate, -1) }))

  // If a goal is already booked to start later, stop the new one before it
  // rather than leaving two goals covering the same dates
  const laterStarts = live
    .filter((g) => (g.effective_start_month ?? '') > startDate)
    .map((g) => g.effective_start_month)
    .sort()

  return {
    correct: null,
    toEnd,
    insertEnd: laterStarts.length ? shiftDay(laterStarts[0], -1) : null,
  }
}

// Whether two goals cover any of the same dates
export function overlaps(a, b) {
  const startA = a.effective_start_month || '0000-01-01'
  const endA   = a.effective_end_month   || '9999-12-31'
  const startB = b.effective_start_month || '0000-01-01'
  const endB   = b.effective_end_month   || '9999-12-31'
  return startA <= endB && startB <= endA
}
