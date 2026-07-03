# APT Task Tracker — Kipu Support Metrics

## Status Key
| Symbol | Meaning |
|--------|---------|
| `[ ]` | To Do |
| `[~]` | In Progress |
| `[✓]` | Needs Review (pushed — waiting for Angelique to confirm) |
| `[✅]` | Complete (tested and approved) |
| `[!]` | Rework Needed (see Rework Log) |
| `[B]` | Blocked (waiting for client input) |

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
| `[✅]` | APT-59 | Link agent name to admin profile (Profile → button) + Reporting Supervisor field added | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-65 | Remove the outbound call column | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-71 | Remove the outbound call column | Team Dashboard | Angelique | 29-May |
| `[✅]` | APT-115 | Replace typed YYYY-MM date fields with full day-level date pickers — agent profile Team Assignments + Team Assignments page | Admin | — | 2-Jul |

### S — 1–3 hours each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[✅]` | APT-38 | Show overall rating in the 1:1 view header | Agent Perf | Angelique | 29-May |
| `[ ]` | APT-40 | Show goal, actual, tolerance, and status for each metric | Agent Perf | — | — |
| `[ ]` | APT-31 | Show goal, actual, tolerance, and status for each metric | Agent Perf | — | — |
| `[ ]` | APT-44 | Show overall rating in the 1:1 view header | Team Dashboard | — | — |
| `[~]` | APT-46 | Show goal, actual, tolerance, and status for each metric — in progress; dev team has access to team goal spreadsheets (Billing, RCM, CRM) shared 12-Jun; goal values being corrected | Team Dashboard | Angelique | 1-Jun |
| `[✅]` | APT-60 | Make the left panel collapsible | All | Angelique | 29-May |
| `[✅]` | APT-61 | Keep filters persistent across tabs (team, agent, month, year) | All | Angelique | 29-May |
| `[~]` | APT-62 | Use the full screen width — Trend + Team Dashboard tables now full width on staging; Monthly/YTD/Quarterly/Half-Year stay compact. On hold: Angelique is building an HTML mockup of what she's hoping for before we expand those views. | All | Chad | 1-Jun |
| `[ ]` | APT-68 | Show the rating distribution | Team Dashboard | Chad | 1-Jun |
| `[✅]` | APT-69 | Fix supervisors showing under Leadership — role label renamed to "Supervisors" | Team Dashboard | Chad | 1-Jun |
| `[✅]` | APT-70 | Clean up the quarterly view (dropdown, separators) | Team Dashboard | Angelique | 29-May |
| `[ ]` | APT-72 | Add active/inactive toggle for agents | Admin | — | — |
| `[✅]` | APT-73 | Allow multi-team agent assignment (UI only; schema already supports it) | Admin | Angelique | 29-May |
| `[✅]` | APT-74 | Separate role and team into dropdowns | Admin | Angelique | 29-May |
| `[✅]` | APT-78 | Hide inactive agents from dashboards | Agent Perf / Team | Angelique | 29-May |
| `[✅]` | APT-79 | Add an active/inactive filter | Agent Perf / Team | Angelique | 29-May |
| `[✅]` | APT-82 | Add year and month dropdowns to attendance | Attendance | Angelique | 29-May |
| `[✓]` | APT-85 | Fix bulk apply to selected agents — cell click now toggles date selection when agents are checked; added "Clear Selected Cells" bulk button; hint shown when no dates selected yet | Attendance | Chad | 1-Jun |
| `[✅]` | APT-86 | Hide inactive agents from attendance | Attendance | Angelique | 29-May |
| `[✅]` | APT-87 | Verify attendance saves across sessions | Attendance | Angelique | 29-May |
| `[ ]` | APT-89 | Add a notes field to the agent view | Agent Perf | Chad | 1-Jun |
| `[✅]` | APT-91 | Auto-fill Created Date on notes (created_at already in DB) | Notes | Chad | 29-May |
| `[✅]` | APT-97 | Add Reporting Supervisor dropdown to agent profile | Admin | Chad | — |
| `[✅]` | APT-109 | Add Employment End Date to agent profile. Auto-sets agent inactive when date passes (checked on page load + on save). SQL: `ALTER TABLE metrics_agents ADD COLUMN IF NOT EXISTS employment_end_date date;` | Admin | Chad | — |
| `[✓]` | APT-110 | Attendance Entry — fix bulk holiday application and apply-to-selected agents (umbrella for APT-84/APT-85); walkthrough video recorded 12-Jun | Attendance | Chad | 15-Jun |
| `[✓]` | APT-114 | Fix error when saving notes ("Could not find the 'created_by' column") — graceful fallback deployed; full fix requires Supabase admin to run: `ALTER TABLE metrics_agent_monthly_notes ADD COLUMN IF NOT EXISTS created_by text;` | Notes | Chad | 15-Jun |
| `[✅]` | APT-120 | Attendance entries not reflecting on Agent Performance / Team Dashboard — Attendance % metric now reads live from the daily attendance records (same source as Attendance Summary); tested on staging and published to live 3-Jul | Agent Perf / Team | — | 3-Jul |
| `[✅]` | APT-121 | Export CSV buttons on Attendance Entry (all day-by-day records: Agent, Date, Code) and Attendance Summary (all months: Agent, Team, Month, Scheduled, Available, %) — exports include ALL attendance data regardless of on-screen filters | Attendance | — | 3-Jul |
| `[✅]` | APT-122 | Attendance Entry not saving for Jovana and Mindy — entries actually saved but the grid re-loaded through a view that drops agents without an active team assignment; grid and CSV export now read straight from the saved records | Attendance | — | 3-Jul |
| `[✅]` | APT-123 | Follow-up to APT-122 (June 26 still missing for Jovana/Mindy): Attendance Summary, dashboards' Attendance %, and both CSV exports now all compute from the raw saved records — no dependence on team-assignment date windows anywhere. Save now also verifies and shows a plain-English error naming any entry that failed to save. | Attendance | — | 3-Jul |

### M — 3–8 hours each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[✅]` | APT-36 | Build the rating calculation logic — frontend calculator built: counts only `counts_toward_score=true` metrics with data+goal; thresholds: 100%=Meets, 75–99%=Needs Improvement, <75%=Below. DB summary view updated to match. Exceeds tier pending client sign-off. | Agent Perf + Team | Chad | — |
| `[✅]` | APT-41 | Add the time period toggle (Monthly/Quarterly/Half-Year/YTD/Trend) | Agent Perf | Angelique | 29-May |
| `[✅]` | APT-42 | Build the rating calculation logic | Team Dashboard | — | — |
| `[✅]` | APT-47 | Add team-first selection with recalculation — Team Selection → Agent List → Recalculation implemented in the 1:1 view | Agent Perf | Chad | 1-Jun |
| `[✅]` | APT-48 | Add the time period toggle | Team Dashboard | — | — |
| `[✅]` | APT-49 | Add a YTD summary view | Agent Perf / Team | Angelique | 29-May |
| `[✅]` | APT-50 | Add a monthly trend breakdown | Agent Perf | Chad | 29-May |
| `[ ]` | APT-64 | Add team-first selection with recalculation | Team Dashboard | — | — |
| `[✅]` | APT-66 | Add a team leaderboard | Team Dashboard | Angelique | 29-May |
| `[✅]` | APT-75 | Merge team assignments into the agent profile | Admin | Angelique | 29-May |
| `[B]` | APT-83 | Add an All Months bulk option — Blocked: waiting for Angelique to clarify which section this applies to and what the bulk activity is | Attendance | Chad | 1-Jun |
| `[✓]` | APT-84 | Allow bulk holiday application — holiday panel now has a code dropdown (no more hardcoded H/HOL); "Apply to selected" always visible (greyed when no agents checked); "Apply to all N agents" always available | Attendance | Chad | 1-Jun |

### L — 1–2 days each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[ ]` | APT-58 | Add a simplified 1:1 mode | Agent Perf | — | — |
| `[B]` | APT-63 | Bring back the trending data view — Blocked: waiting for client input on (1) how to define "maintaining" for % vs. absolute value metrics; (2) whether trend indicators compare to previous month or current month; (3) how to handle goals that change mid-period | Agent Perf | Chad | 1-Jun |

### XL — 2+ days each

| Status | APT | Task | Area | Assignee | Due |
|--------|-----|------|------|----------|-----|
| `[B]` | APT-39 | Add AI performance summary to the 1:1 view — Blocked: waiting for Angelique to confirm final description; should highlight strengths, risks, and coaching suggestions; must adapt when supervisor notes explain an exception | Agent Perf | Chad | 1-Jun |
| `[ ]` | APT-45 | Add AI performance summary to the 1:1 view | Team Dashboard | — | — |
| `[B]` | APT-92 | Have the AI reference supervisor notes — Blocked: may overlap with APT-39/APT-63; waiting for Angelique to confirm if this is a separate deliverable or covered by those tasks | Notes | Chad | 1-Jun |

---

## Group 2 — Schema Changes Required

| Status | APT | Task | Area | Difficulty | Schema Change | Assignee | Due |
|--------|-----|------|------|------------|---------------|----------|-----|
| `[ ]` | APT-90 | Add public/private toggle to notes | Notes | S | Add `is_private` bool to `metrics_agent_monthly_notes` | Chad | 1-Jun |
| `[✓]` | APT-91* | Auto-fill Created By (supervisor dropdown; no login system) | Notes | S | Add `created_by` to `metrics_agent_monthly_notes` | Chad | 29-May |
| `[B]` | APT-88 | Build the metric override feature — Blocked: waiting for Angelique to clarify what "override" means (editing a metric definition vs. editing a goal vs. something else) | Agent Perf | L | New table: `metrics_agent_overrides` | Chad | 1-Jun |
| `[✓]` | APT-81 | Show correct historical goal per month. Implemented via frontend overlay: `getActiveGoals()` queries goals filtered by date range; now supports day-level precision (not just month and year). No Supabase view change needed. | Goals | L | Frontend overlay — no schema change | Chad | TBD |
| `[✅]` | APT-80 | Allow metrics to be toggled per team — implemented via active/inactive toggle on metric definitions and in the Goals section (no new table needed) | Admin | L | No new table needed | Chad | 1-Jun |
| `[✅]` | APT-77 | Restructure goals to be role-based — role-based goals now live (e.g., CRM and CRM - PSA can have separate goal sets via existing team/group structure) | Goals | XL | Implemented via existing group structure | Chad | 1-Jun |

*APT-91 appears in both groups: showing `created_at` (no schema change, done ✅) vs. showing `created_by` supervisor name (schema change, still pending).

---

## Verification & QA

These tasks are about confirming data accuracy and signing off on the tool with the supervisors. Owned by Angelique.

| Status | APT | Task | Assignee | Due |
|--------|-----|------|----------|-----|
| `[ ]` | APT-93 | Reconcile data v2 after fixes | Angelique | 1-Jun |
| `[B]` | APT-94 | Verify tolerances match the Manager Guide — Blocked: dev team needs access to the Manager Guide Confluence page; Chad to grant access | Angelique | 1-Jun |
| `[ ]` | APT-95 | Verify the rating calculation | Angelique | 1-Jun |
| `[ ]` | APT-96 | Walk through the tool with supervisors | Angelique | 18-Jun |

---

## Rework Log

> Items land here when testing reveals an issue. Format: APT number, what failed, what was fixed, re-test result.

| APT | Reported Issue | Fix Applied | Re-test |
|-----|---------------|-------------|---------|
| APT-46 | Tolerance not displaying (fixed ✓); Start/End Month fields confusing (replaced with date pickers ✓); goal values in DB may still be incorrect — needs Angelique to verify against team scorecards (Billing, RCM, CRM spreadsheets shared 12-Jun) | Tolerance display + date pickers pushed; dev team has access to scorecards | Pending data verification |
| APT-76 | Open question: does "merge" mean remove the Scored/Additional split entirely, or just combine into one section? Needs Angelique to clarify | Pending clarification | — |

---

## Recently Pushed — Needs Testing

| APT | What to test |
|-----|-------------|
| APT-46 | Team Dashboard → pick any team + month → the **Goal**, **Tolerance**, and **On Track** columns should appear alongside each metric. Goal values should match the team's scorecard spreadsheet. |
| APT-81 | Admin > Goals → set a goal with a specific Start Date and End Date (day-level, e.g. 2026-06-15 to 2026-07-31) → Agent Perf + Team Dashboard → navigate to that month → Goal and Tolerance should show the values active during those exact dates. |
| APT-84 + APT-85 + APT-110 | Attendance Entry → (1) Check 2+ agent rows → click any cell in the grid → the date column should become selected (not open a popup) → choose a code → "Apply to Selected Cells" should enable and apply. (2) After applying, select cells again and click "Clear Selected Cells" — entries should be removed. (3) Click "US Holidays This Month" → "Apply to all N agents" and "Apply to selected" buttons should apply code H correctly. |
| APT-91 + APT-114 | Agent Perf → supervisor dropdown above Save Note should work; Hide/Show Notes toggle should work; note should save without error. Admin > Notes → Created By shows supervisor name. Note: the `created_by` DB column still needs to be added by Supabase admin — until then notes save but without the supervisor name. |
| APT-109 | Admin > Agents → Edit any agent → **Employment End Date** field should appear. Setting a past date should immediately mark agent inactive. Setting a future date should auto-deactivate when that date arrives. |
| APT-120 | Agent Performance → pick Brett Jones, June → the **Attendance %** row should now match the Attendance Summary page for June (including the June 26 entry). Team Dashboard → same team + June → Brett's attendance column should match too. Quarterly/YTD/Trend tabs also pick up live attendance. |
| APT-121 | Attendance Entry → **Export CSV** button (top-right of the action row) should download a file with every saved attendance record: Agent, Date, Code, Code Name. Attendance Summary → **Export CSV** button (right of the filter bar) should download Agent, Team, Month, Scheduled Days, Available Days, Attendance % for all months. Both exports include everything, not just the month/team on screen. Files open in Excel. |
| APT-122 | Attendance Entry → enter attendance for **Jovana** and **Mindy**, click Save All Changes, then refresh the page → their entries should still be there. Also check whether those two show up on the **Attendance Summary** page — if they don't, tell me: that part lives in the database and needs the Supabase admin to adjust (likely a missing team assignment). |
| APT-123 | On STAGING, hard-refresh (Ctrl+Shift+R) first. Attendance Entry → June → enter a code on June 26 for Jovana and Mindy → Save All Changes. Either it says "Saved" (then refresh — entries must persist, and June must show them on Attendance Summary too), or a red message names exactly which entries didn't save — report that message word for word. |

---

_Last updated: 2026-06-12 — Synced with JIRA CSV export; statuses updated, blocked tasks flagged, APT-110 and APT-114 added_
