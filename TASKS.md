# APT Task Tracker — Kipu Support Metrics

## Status Key
| Symbol | Meaning |
|--------|---------|
| `[ ]` | To Do |
| `[~]` | In Progress |
| `[✓]` | Needs Review (pushed — ready to test on Vercel) |
| `[✅]` | Complete (tested and passed) |
| `[!]` | Rework Needed (see Rework Log) |

## The Loop
1. I pick the next task → mark `[~]` → build + push
2. I mark `[✓]` and write a **Test:** line telling you exactly what to click/check
3. You test on Vercel → reply **pass** or describe the issue
4. Pass → I mark `[✅]` Complete
5. Issue → I log it in the Rework Log, fix it, push again → back to step 2

---

## Group 1 — No Schema Changes Required

### XS — Under 1 hour each

| Status | APT | Task | Area |
|--------|-----|------|------|
| `[✅]` | APT-76 | Merge the two metrics sections into one | Agent Perf |
| `[✅]` | APT-67 | Filter out inactive agents (monthly + Q/H tables) — Team Dashboard only; Agent Perf filter is APT-79 | Team Dashboard |
| `[✓]` | APT-35 | Standardize number rounding (e.g. 85% not 85.19%) | All |
| `[✅]` | APT-37 | Add color coding to ratings (already applied via ratingClass) | Agent Perf |
| `[✅]` | APT-43 | Add color coding to ratings (already applied via ratingClass) | Team Dashboard |
| `[✓]` | APT-59 | Link agent name to admin profile (Profile → button; opens edit modal) | Agent Perf |
| `[✓]` | APT-65 | Remove the outbound call column — needs metric deactivated in Admin > Metrics first, then buildMetricList filter update | Agent Perf |
| `[✓]` | APT-71 | Remove the outbound call column — same as APT-65 | Team Dashboard |

### S — 1–3 hours each

| Status | APT | Task | Area |
|--------|-----|------|------|
| `[ ]` | APT-38 | Show overall rating in the 1:1 view header | Agent Perf |
| `[ ]` | APT-40 | Show goal, actual, tolerance, and status for each metric | Agent Perf |
| `[ ]` | APT-31 | Show goal, actual, tolerance, and status for each metric | Agent Perf |
| `[ ]` | APT-44 | Show overall rating in the 1:1 view header | Team Dashboard |
| `[✓]` | APT-46 | Show goal, actual, tolerance, and status for each metric | Team Dashboard |
| `[✅]` | APT-60 | Make the left panel collapsible | All |
| `[✓]` | APT-61 | Keep filters persistent across tabs | All |
| `[ ]` | APT-62 | Use the full screen width | All |
| `[ ]` | APT-68 | Show the rating distribution | Team Dashboard |
| `[ ]` | APT-69 | Fix supervisors showing under Leadership | Team Dashboard |
| `[✓]` | APT-70 | Clean up the quarterly view (dropdown, separators) | Team Dashboard |
| `[ ]` | APT-72 | Add active/inactive toggle for agents | Admin |
| `[✓]` | APT-74 | Separate role and team into dropdowns | Admin |
| `[✓]` | APT-78 | Hide inactive agents from dashboards | Agent Perf / Team |
| `[✓]` | APT-79 | Add an active/inactive filter | Agent Perf / Team |
| `[✓]` | APT-82 | Add year and month dropdowns to attendance | Attendance |
| `[ ]` | APT-85 | Fix bulk apply to selected agents | Attendance |
| `[✓]` | APT-86 | Hide inactive agents from attendance | Attendance |
| `[ ]` | APT-89 | Add a notes field to the agent view | Agent Perf |
| `[✓]` | APT-91 | Auto-fill Created Date on notes (created_at already in DB) | Notes |

### M — 3–8 hours each

| Status | APT | Task | Area |
|--------|-----|------|------|
| `[ ]` | APT-36 | Build the rating calculation logic | Agent Perf |
| `[✓]` | APT-41 | Add the time period toggle | Agent Perf |
| `[ ]` | APT-42 | Build the rating calculation logic | Team Dashboard |
| `[ ]` | APT-47 | Add team-first selection with recalculation | Agent Perf |
| `[✓]` | APT-48 | Add the time period toggle | Team Dashboard |
| `[✓]` | APT-49 | Add a YTD summary view | Agent Perf / Team |
| `[✓]` | APT-50 | Add a monthly trend breakdown | Agent Perf |
| `[ ]` | APT-64 | Add team-first selection with recalculation | Team Dashboard |
| `[✓]` | APT-66 | Add a team leaderboard | Team Dashboard |
| `[✓]` | APT-75 | Merge team assignments into the agent profile | Admin |
| `[ ]` | APT-83 | Add an All Months bulk option | Attendance |
| `[ ]` | APT-84 | Allow bulk holiday application | Attendance |

### L — 1–2 days each

| Status | APT | Task | Area |
|--------|-----|------|------|
| `[ ]` | APT-58 | Add a simplified 1:1 mode | Agent Perf |
| `[ ]` | APT-63 | Bring back the trending data view | Agent Perf |
| `[ ]` | APT-73 | Allow multi-team agent assignment (UI only; schema already supports it) | Admin |

### XL — 2+ days each

| Status | APT | Task | Area |
|--------|-----|------|------|
| `[ ]` | APT-39 | Add AI performance summary to the 1:1 view | Agent Perf |
| `[ ]` | APT-45 | Add AI performance summary to the 1:1 view | Team Dashboard |
| `[ ]` | APT-92 | Have the AI reference supervisor notes | Notes |

---

## Group 2 — Schema Changes Required

| Status | APT | Task | Area | Difficulty | Schema Change |
|--------|-----|------|------|------------|---------------|
| `[~]` | APT-93 | Add Reporting Supervisor dropdown to agent profile | Admin | S | Add `supervisor_id` to `metrics_agents` |
| `[ ]` | APT-90 | Add public/private toggle to notes | Notes | S | Add `is_private` bool to `metrics_agent_monthly_notes` |
| `[ ]` | APT-91* | Auto-fill Created By (name field, not just date) | Notes | S | Add `created_by` to `metrics_agent_monthly_notes` |
| `[ ]` | APT-88 | Build the metric override feature | Agent Perf | L | New table: `metrics_agent_overrides` |
| `[ ]` | APT-81 | Add effective dates for goal changes | Goals | L | Add `effective_from`/`effective_to` to `metrics_group_goals` |
| `[ ]` | APT-80 | Allow metrics to be toggled per team | Admin | L | New table: `metrics_group_metric_visibility` |
| `[ ]` | APT-77 | Restructure goals to be role-based | Goals | XL | Add `role` dimension to `metrics_group_goals` |

*APT-91 appears in both groups: showing `created_at` (no schema change) vs. showing `created_by` name (schema change).

---

## Rework Log

> Items land here when testing reveals an issue. Format: APT number, what failed, what was fixed, re-test result.

| APT | Reported Issue | Fix Applied | Re-test |
|-----|---------------|-------------|---------|
| — | — | — | — |

---

## Recently Pushed — Needs Testing

| APT | What to test |
|-----|-------------|
| APT-35 | Open Agent Perf, pick any agent — percentages like Call Acceptance should now show as whole numbers (e.g. 85% not 85.19%) |
| APT-59 | Select an agent → a **Profile →** button appears next to the dropdown → click it → opens Admin Agents with that agent's edit modal already open |
| APT-41 | Agent Perf → pick agent → tabs appear: Monthly / Quarterly / Half-Year / YTD / Trend — click each and verify data |
| APT-46 | Team Dashboard → monthly table cells should show small "Goal: X" sub-text below the actual value |
| APT-48 | Team Dashboard → quarterly and half-year tables appear in the rollup section |
| APT-49 | Agent Perf → YTD tab → shows aggregated actuals through current month |
| APT-50 | Agent Perf → Trend tab → shows one column per month with values |
| APT-61 | Change any filter (team, month, year), navigate away, come back — filter should be remembered |
| APT-65 | Go to Admin > Metrics, deactivate "Outbound Calls" — it should disappear from Agent Perf metric tables |
| APT-66 | Team Dashboard → leaderboard table appears above the monthly performance table |
| APT-70 | Team Dashboard → quarter dropdown (All Quarters / Q1–Q4) appears next to rollup year selector |
| APT-71 | Same as APT-65 but for Team Dashboard |
| APT-74 | Admin > Agents → Edit any agent → Role field is now a dropdown with predefined options |
| APT-75 | Admin > Agents → Edit any agent → Team Assignments section shows at bottom of modal with add/remove |
| APT-78/79 | Agent Perf and Team Dashboard → "Show inactive" checkbox in filter bar hides/shows inactive agents |
| APT-82 | Attendance Entry → Month picker is now two dropdowns: Year and Month separately |
| APT-86 | Attendance Entry → "Show inactive" checkbox; inactive agents hidden by default |
| APT-91 | Agent Perf → save a note → a "Note created: [date]" line appears below the Save button |

---

_Last updated: 2026-05-26 — APT-37 rating colors updated; APT-50 trend header fix pushed; APT-93 supervisor dropdown pushed (requires DB step — see supabase/add_supervisor_id.sql)_
