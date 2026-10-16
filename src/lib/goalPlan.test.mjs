// APT-145: run with `node src/lib/goalPlan.test.mjs` — no test runner needed.
// These rules decide which goal a report is judged against and write to the
// shared live database, so they are worth checking after any change.
import { shiftDay, runsOn, overlaps, planGoalChange } from './goalPlan.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log(`  ok   ${name}`) }
  else { fail++; console.log(`  FAIL ${name}\n       got  ${g}\n       want ${w}`) }
}

const goal = (o) => ({ active: true, effective_start_month: null, effective_end_month: null, ...o })

console.log('shiftDay')
eq('one day back', shiftDay('2026-10-15', -1), '2026-10-14')
eq('across month start', shiftDay('2026-11-01', -1), '2026-10-31')
eq('across year start', shiftDay('2026-01-01', -1), '2025-12-31')
eq('leap day', shiftDay('2024-03-01', -1), '2024-02-29')
eq('non-leap', shiftDay('2026-03-01', -1), '2026-02-28')

console.log('\nrunsOn')
eq('open-ended runs', runsOn(goal({ effective_start_month: '2026-01-01' }), '2026-10-15'), true)
eq('not started yet', runsOn(goal({ effective_start_month: '2027-01-01' }), '2026-10-15'), false)
eq('already ended', runsOn(goal({ effective_end_month: '2026-09-30' }), '2026-10-15'), false)
eq('ends today, still runs', runsOn(goal({ effective_end_month: '2026-10-15' }), '2026-10-15'), true)
eq('starts today, runs', runsOn(goal({ effective_start_month: '2026-10-15' }), '2026-10-15'), true)
eq('switched off', runsOn(goal({ active: false }), '2026-10-15'), false)
eq('no dates at all', runsOn(goal({}), '2026-10-15'), true)

console.log('\noverlaps')
const jan = goal({ effective_start_month: '2026-01-01', effective_end_month: '2026-06-30' })
const jul = goal({ effective_start_month: '2026-07-01', effective_end_month: null })
eq('back to back do not clash', overlaps(jan, jul), false)
eq('order does not matter', overlaps(jul, jan), false)
eq('touching on one day clashes',
   overlaps(jan, goal({ effective_start_month: '2026-06-30' })), true)
// THE BILLING CASE: two open-ended goals for the same metric
eq('two open-ended clash',
   overlaps(goal({ effective_start_month: '2026-01-01' }), goal({ effective_start_month: '2026-06-01' })), true)
eq('blank dates clash with everything', overlaps(goal({}), jan), true)
eq('fully contained clashes',
   overlaps(jan, goal({ effective_start_month: '2026-02-01', effective_end_month: '2026-03-01' })), true)
eq('far apart do not clash',
   overlaps(jan, goal({ effective_start_month: '2027-01-01', effective_end_month: '2027-06-30' })), false)

console.log('\nplanGoalChange')
eq('no goal yet', planGoalChange([], '2026-10-15'), { correct: null, toEnd: [], insertEnd: null })
eq('ends the running goal',
   planGoalChange([goal({ id: 1, effective_start_month: '2026-01-01' })], '2026-10-15'),
   { correct: null, toEnd: [{ id: 1, endDate: '2026-10-14' }], insertEnd: null })
eq('same start corrects in place',
   planGoalChange([goal({ id: 2, effective_start_month: '2026-10-15' })], '2026-10-15').correct?.id, 2)
eq('same start adds nothing',
   planGoalChange([goal({ id: 2, effective_start_month: '2026-10-15' })], '2026-10-15').toEnd, [])
eq('expired goal untouched',
   planGoalChange([goal({ id: 3, effective_start_month: '2025-01-01', effective_end_month: '2025-12-31' })], '2026-10-15'),
   { correct: null, toEnd: [], insertEnd: null })
eq('switched-off goal ignored',
   planGoalChange([goal({ id: 4, active: false, effective_start_month: '2026-01-01' })], '2026-10-15'),
   { correct: null, toEnd: [], insertEnd: null })
eq('stops before a future goal',
   planGoalChange([goal({ id: 5, effective_start_month: '2027-01-01' })], '2026-10-15'),
   { correct: null, toEnd: [], insertEnd: '2026-12-31' })
// THE BILLING CASE: a team already carrying two goals gets both closed off
eq('both duplicates ended',
   planGoalChange([
     goal({ id: 6, effective_start_month: '2026-01-01' }),
     goal({ id: 7, effective_start_month: '2026-06-01' }),
   ], '2026-10-15').toEnd,
   [{ id: 6, endDate: '2026-10-14' }, { id: 7, endDate: '2026-10-14' }])
eq('ends current and bounds the new one',
   planGoalChange([
     goal({ id: 8, effective_start_month: '2026-01-01' }),
     goal({ id: 9, effective_start_month: '2027-03-01' }),
   ], '2026-10-15'),
   { correct: null, toEnd: [{ id: 8, endDate: '2026-10-14' }], insertEnd: '2027-02-28' })
eq('backdating stops before the existing goal',
   planGoalChange([goal({ id: 10, effective_start_month: '2026-01-01' })], '2025-06-01'),
   { correct: null, toEnd: [], insertEnd: '2025-12-31' })

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
