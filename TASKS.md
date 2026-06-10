# APT Task Tracker — Kipu Support Metrics

## Status Key
| Symbol | Meaning |
|--------|---------|
| `[ ]` | To Do |
| `[~]` | In Progress |
| `[✓]` | Needs Review (pushed — waiting for Angelique to confirm) |
| `[✅]` | Complete (tested and approved) |
| `[!]` | Rework Needed (see Rework Log) |

## The Loop
1. I pick the next task → mark `[~]` → build + push
2. I mark `[✓]` and write a **Test:** line telling you exactly what to click/check
3. Angelique or Chad tests on the live/staging site → reply **pass** or describe the issue
4. Pass → I mark `[✅]` Complete
5. Issue → I log it in the Rework Log, fix it, push again → back to step 2

---

## Group 1 — No Schema Changes Required

### XS — Under 1 hour each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[✅]` | APT-76 | Merge the two metrics sections into one | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-67 | Filter out inactive agents (monthly + Q/H tables) | Team Dashboard | — | — |
| `[✅]` | APT-35 | Standardize number rounding (e.g. 85% not 85.19%) | All | Angelique | 29-May |
| `[✅]` | APT-37 | Add color coding to ratings — Gold/Green/Orange/Red | Agent Perf + Team | Chad | 29-May |
| `[✅]` | APT-59 | Link agent name to admin profile (Profile → button) | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-65 | Remove the outbound call column | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-71 | Remove the outbound call column | Team Dashboard | Angelique | 29-May |

### S — 1–3 hours each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[✓]` | APT-38 | Show overall rating in the 1:1 view header | Agent Perf | Angelique | 29-May |
| `[ ]` | APT-40 | Show goal, actual, tolerance, and status for each metric | Agent Perf | — | — |
| `[ ]` | APT-31 | Show goal, actual, tolerance, and status for each metric | Agent Perf | — | — |
| `[ ]` | APT-44 | Show overall rating in the 1:1 view header | Team Dashboard | — | — |
| `[~]` | APT-46 | Show goal, actual, tolerance, and status for each metric — partial work done, tolerance + goal values need fixing (see Rework Log) | Team Dashboard | Angelique | 1-Jun |
| `[✅]` | APT-60 | Make the left panel collapsible | All | Angelique | 29-May |
| `[✅]` | APT-61 | Keep filters persistent across tabs (team, agent, month, year) | All | Angelique | 29-May |
| `[~]` | APT-62 | Use the full screen width — Trend + Team Dashboard tables now full width on staging; Monthly/YTD/Quarterly/Half-Year stay compact. On hold: waiting for client input on whether additional data can fill the blank space in Quarterly/Half-Year views before promoting to live. | All | Chad | 1-Jun |
| `[ ]` | APT-68 | Show the rating distribution | Team Dashboard | Chad | 1-Jun |
| `[ ]` | APT-69 | Fix supervisors showing under Leadership | Team Dashboard | Chad | 1-Jun |
| `[✅]` | APT-70 | Clean up the quarterly view (dropdown, separators) | Team Dashboard | Angelique | 29-May |
| `[ ]` | APT-72 | Add active/inactive toggle for agents | Admin | — | — |
| `[✓]` | APT-73 | Allow multi-team agent assignment (UI only; schema already supports it) | Admin | Angelique | 29-May |
| `[✅]` | APT-74 | Separate role and team into dropdowns | Admin | Angelique | 29-May |
| `[✅]` | APT-78 | Hide inactive agents from dashboards | Agent Perf / Team | Angelique | 29-May |
| `[✅]` | APT-79 | Add an active/inactive filter | Agent Perf / Team | Angelique | 29-May |
| `[✅]` | APT-82 | Add year and month dropdowns to attendance | Attendance | Angelique | 29-May |
| `[ ]` | APT-85 | Fix bulk apply to selected agents | Attendance | Chad | 1-Jun |
| `[✅]` | APT-86 | Hide inactive agents from attendance | Attendance | Angelique | 29-May |
| `[✓]` | APT-87 | Verify attendance saves across sessions | Attendance | Angelique | 29-May |
| `[ ]` | APT-89 | Add a notes field to the agent view | Agent Perf | Chad | 1-Jun |
| `[✅]` | APT-91 | Auto-fill Created Date on notes (created_at already in DB) | Notes | Chad | 29-May |
| `[✅]` | APT-97 | Add Reporting Supervisor dropdown to agent profile | Admin | Chad | — |

### M — 3–8 hours each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[✅]` | APT-36 | Build the rating calculation logic — frontend calculator built: counts only `counts_toward_score=true` metrics with data+goal; thresholds: 100%=Meets, 75–99%=Needs Improvement, <75%=Below. DB summary view updated to match. Exceeds tier pending client sign-off. | Agent Perf + Team | Chad | — |
| `[✅]` | APT-41 | Add the time period toggle (Monthly/Quarterly/Half-Year/YTD/Trend) | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-42 | Build the rating calculation logic | Team Dashboard | — | — |
| `[ ]` | APT-47 | Add team-first selection with recalculation | Agent Perf | Chad | 1-Jun |
| `[✅]` | APT-48 | Add the time period toggle | Team Dashboard | — | — |
| `[✅]` | APT-49 | Add a YTD summary view | Agent Perf / Team | Angelique | 29-May |
| `[✅]` | APT-50 | Add a monthly trend breakdown | Agent Perf | Chad | 29-May |
| `[ ]` | APT-64 | Add team-first selection with recalculation | Team Dashboard | — | — |
| `[✅]` | APT-66 | Add a team leaderboard | Team Dashboard | Angelique | 29-May |
| `[✅]` | APT-75 | Merge team assignments into the agent profile | Admin | Angelique | 29-May |
| `[ ]` | APT-83 | Add an All Months bulk option | Attendance | Chad | 1-Jun |
| `[ ]` | APT-84 | Allow bulk holiday application | Attendance | Chad | 1-Jun |

### L — 1–2 days each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[ ]` | APT-58 | Add a simplified 1:1 mode | Agent Perf | — | — |
| `[ ]` | APT-63 | Bring back the trending data view | Agent Perf | Chad | 1-Jun |

### XL — 2+ days each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[ ]` | APT-39 | Add AI performance summary to the 1:1 view | Agent Perf | Chad | 1-Jun |
| `[ ]` | APT-45 | Add AI performance summary to the 1:1 view | Team Dashboard | — | — |
| `[ ]` | APT-92 | Have the AI reference supervisor notes | Notes | Chad | 1-Jun |

---

## Group 2 — Schema Changes Required

| Status | APT | Task | Area | Difficulty | Schema Change | Assignee | Due |
|--------|-----|------|------|------------|---------------|----------|-----|
| `[ ]` | APT-90 | Add public/private toggle to notes | Notes | S | Add `is_private` bool to `metrics_agent_monthly_notes` | Chad | 1-Jun |
| `[✅]` | APT-91* | Auto-fill Created By (supervisor dropdown; no login system) | Notes | S | Add `created_by` to `metrics_agent_monthly_notes` | Chad | 29-May |
| `[ ]` | APT-88 | Build the metric override feature | Agent Perf | L | New table: `metrics_agent_overrides` | Chad | 1-Jun |
| `[✓]` | APT-81 | Show correct historical goal per month (goals change quarterly — viewing a backdated month must show the goal that was active then, not today's goal). Implemented via frontend overlay: `getActiveGoals()` queries goals filtered by date range, then the correct goal/tolerance/status is applied before display. No Supabase view change needed. | Goals | L | Frontend overlay — no schema change | Chad | TBD |
| `[ ]` | APT-80 | Allow metrics to be toggled per team | Admin | L | New table: `metrics_group_metric_visibility` | Chad | 1-Jun |
| `[ ]` | APT-77 | Restructure goals to be role-based | Goals | XL | Add `role` dimension to `metrics_group_goals` | Chad | 1-Jun |
| `[✓]` | APT-109 | Add Employment End Date to agent profile. Auto-sets agent inactive when date passes (checked on page load + on save). SQL: `ALTER TABLE metrics_agents ADD COLUMN IF NOT EXISTS employment_end_date date;` | Admin | S | Add `employment_end_date` date col to `metrics_agents` | Chad | — |

*APT-91 appears in both groups: showing `created_at` (no schema change, done ✅) vs. showing `created_by` supervisor name (schema change, still pending).

---

## Verification & QA

These tasks are about confirming data accuracy and signing off on the tool with the supervisors. Owned by Angelique.

| Status | APT | Task | Assignee | Due |
|--------|-----|------|----------|-----|
| `[ ]` | APT-93 | Reconcile data v2 after fixes | Angelique | 1-Jun |
| `[ ]` | APT-94 | Verify tolerances match the Manager Guide | Angelique | 1-Jun |
| `[ ]` | APT-95 | Verify the rating calculation | Angelique | 1-Jun |
| `[ ]` | APT-96 | Walk through the tool with supervisors | Angelique | 29-May |

---

## Rework Log

> Items land here when testing reveals an issue. Format: APT number, what failed, what was fixed, re-test result.

| APT | Reported Issue | Fix Applied | Re-test |
|-----|---------------|-------------|---------|
| APT-46 | Tolerance not displaying (fixed ✓); Start/End Month fields confusing (replaced with date pickers ✓); goal values in DB may still be incorrect — needs Angelique to verify against reference table in Admin > Goals | Tolerance display + date pickers pushed | Pending data verification |
| APT-76 | Open question: does "merge" mean remove the Scored/Additional split entirely, or just combine into one section? Needs Angelique to clarify | Pending clarification | — |

---

## Recently Pushed — Needs Testing

| APT | What to test |
|-----|-------------|
| APT-38 | Agent Perf → pick any agent → the **Overall Rating** label should appear in the header section above the metric tabs |
| APT-73 | Admin > Agents → Edit any agent → **Team Assignments** section should allow adding the same agent to more than one team |
| APT-87 | Attendance Entry → save attendance for an agent → navigate away → come back → the saved values should still be there |
| APT-46 | Admin > Goals → Edit any goal → Start Month and End Month are now date pickers (click to choose month/year) — tested and confirmed ✓ |
| APT-91 | Agent Perf → supervisor dropdown above Save Note, Hide/Show Notes toggle, created_by saved with note; Admin > Notes → Created By is now a supervisor dropdown — tested and confirmed ✓ |
| APT-81 | Agent Perf + Team Dashboard → navigate to a past month → the **Goal** and **Tolerance** columns should show the values that were active during that month, not today's values. To test: set a goal with Start Month = Jan 2026 and End Month = Mar 2026, then view an agent's January scorecard — that goal should appear. View April — a different (or no) goal should appear. |

---

_Last updated: 2026-06-05 — APT-81 pushed (historical goals now display per viewed month, no DB change needed)_
