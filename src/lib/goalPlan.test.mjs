import { planGoalChange, shiftDay } from './goalPlan.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log(`  ok   ${name}`) }
  else { fail++; console.log(`  FAIL ${name}\n       got  ${g}\n       want ${w}`) }
}

console.log('shiftDay')
eq('one day back', shiftDay('2026-10-15', -1), '2026-10-14')
eq('across month start', shiftDay('2026-11-01', -1), '2026-10-31')
eq('across year start', shiftDay('2026-01-01', -1), '2025-12-31')
eq('leap day', shiftDay('2024-03-01', -1), '2024-02-29')
eq('non-leap', shiftDay('2026-03-01', -1), '2026-02-28')

console.log('\nplanGoalChange')
// 1. no goal at all -> plain insert
eq('empty', planGoalChange([], '2026-10-15'), { correct: null, toEnd: [], insertEnd: null })

// 2. a goal running open-ended -> end it the day before
const running = [{ id: 1, active: true, effective_start_month: '2026-01-01', effective_end_month: null }]
eq('ends the running goal', planGoalChange(running, '2026-10-15'),
   { correct: null, toEnd: [{ id: 1, endDate: '2026-10-14' }], insertEnd: null })

// 3. same start date -> correct in place, do not duplicate
const sameDay = [{ id: 2, active: true, effective_start_month: '2026-10-15', effective_end_month: null }]
eq('same start corrects', planGoalChange(sameDay, '2026-10-15').correct?.id, 2)
eq('same start adds nothing', planGoalChange(sameDay, '2026-10-15').toEnd, [])

// 4. an already-expired goal is left alone
const expired = [{ id: 3, active: true, effective_start_month: '2025-01-01', effective_end_month: '2025-12-31' }]
eq('expired untouched', planGoalChange(expired, '2026-10-15'), { correct: null, toEnd: [], insertEnd: null })

// 5. switched-off goal is ignored
const off = [{ id: 4, active: false, effective_start_month: '2026-01-01', effective_end_month: null }]
eq('inactive ignored', planGoalChange(off, '2026-10-15'), { correct: null, toEnd: [], insertEnd: null })

// 6. a future goal already booked -> new goal must stop before it
const future = [{ id: 5, active: true, effective_start_month: '2027-01-01', effective_end_month: null }]
eq('stops before future goal', planGoalChange(future, '2026-10-15'),
   { correct: null, toEnd: [], insertEnd: '2026-12-31' })

// 7. THE BILLING CASE: two goals running for the same metric -> both ended
const billing = [
  { id: 6, active: true, effective_start_month: '2026-01-01', effective_end_month: null },
  { id: 7, active: true, effective_start_month: '2026-06-01', effective_end_month: null },
]
eq('both duplicates ended', planGoalChange(billing, '2026-10-15').toEnd,
   [{ id: 6, endDate: '2026-10-14' }, { id: 7, endDate: '2026-10-14' }])

// 8. running goal AND a future one -> end current, bound the new one
const both = [
  { id: 8, active: true, effective_start_month: '2026-01-01', effective_end_month: null },
  { id: 9, active: true, effective_start_month: '2027-03-01', effective_end_month: null },
]
eq('ends current, bounds new', planGoalChange(both, '2026-10-15'),
   { correct: null, toEnd: [{ id: 8, endDate: '2026-10-14' }], insertEnd: '2027-02-28' })

// 9. backdating before an existing goal
eq('backdated stops before existing', planGoalChange(running, '2025-06-01'),
   { correct: null, toEnd: [], insertEnd: '2025-12-31' })

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
