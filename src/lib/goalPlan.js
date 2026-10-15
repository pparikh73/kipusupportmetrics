// APT-145: works out what has to change when a goal is set for a team.
//
// Kept free of any database code so the rules can be reasoned about — and
// tested — on their own. Reports read whichever goal was in force for the month
// being shown, so the one rule that matters is that a change never overwrites
// the figure an earlier month was judged against.

// 'YYYY-MM-DD' shifted by n days, without tripping over time zones
export function shiftDay(iso, n) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

/**
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
