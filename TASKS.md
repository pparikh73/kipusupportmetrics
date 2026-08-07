# APT Task Tracker — Kipu Support Metrics

> ## ⚠️ PHASE 2 IS ACTIVE (started 21-Jul-2026)
> **Phase 1 is complete and closed.** Everything in the "Phase 1" sections below is
> historical record — do not add new work there.
>
> **Every new task from 21-Jul-2026 onward belongs to Phase 2** and goes in the
> [Phase 2 — Active Work](#phase-2--active-work) section directly below, numbered
> from **APT-136** up. Tag each one **`P2`** in the Phase column.
>
> Phase 1 ended at APT-135. Anything still open from Phase 1 (blocked or parked
> items) stays where it is until it's picked up — if it is picked up in Phase 2,
> note that in its row rather than moving it.

## Phase 2 — Active Work

_Started 21-Jul-2026. New tasks go here, numbered from APT-136._

| Status | Phase | APT | Task | Area | Assignee | Due |
|--------|-------|-----|------|------|----------|-----|
| | P2 | — | _(no Phase 2 tasks logged yet)_ | — | — | — |

---

# Phase 1 — Completed 21-Jul-2026 (historical record)

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
| `[✅]` | APT-62 | Use the full screen width — RESOLVED 8-Jul per client feedback: the full-width experiment left a large empty gap between the Metric column and the data columns, so Trend (Agent Perf) and the Team Dashboard metric tables are back to compact layout matching Quarterly/Half-Year. Leaderboard stays full width. | All | Chad | 8-Jul |
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
| `[✓]` | APT-117 | Assistance filling in attendance for agents Jan–Apr 2026 — client's Excel tracker converted to a clean import file (1,180 entries, 18 agents); new **Import File** button on Attendance Entry bulk-loads CSV or Excel (.xlsx) with a confirmation step; exports on both attendance pages now produce Excel files. **11-Jul: Import/Export buttons REMOVED from both attendance pages on staging by client request (see APT-133) — this feature was never published to live.** | Attendance | — | 7-Jul |
| `[✅]` | APT-120 | Attendance entries not reflecting on Agent Performance / Team Dashboard — Attendance % metric now reads live from the daily attendance records (same source as Attendance Summary); tested on staging and published to live 3-Jul | Agent Perf / Team | — | 3-Jul |
| `[✅]` | APT-121 | Export CSV buttons on Attendance Entry (all day-by-day records: Agent, Date, Code) and Attendance Summary (all months: Agent, Team, Month, Scheduled, Available, %) — exports include ALL attendance data regardless of on-screen filters | Attendance | — | 3-Jul |
| `[✅]` | APT-122 | Attendance Entry not saving for Jovana and Mindy — entries actually saved but the grid re-loaded through a view that drops agents without an active team assignment; grid and CSV export now read straight from the saved records | Attendance | — | 3-Jul |
| `[✅]` | APT-123 | Follow-up to APT-122 (June 26 still missing for Jovana/Mindy): Attendance Summary, dashboards' Attendance %, and both CSV exports now all compute from the raw saved records — no dependence on team-assignment date windows anywhere. Save now also verifies and shows a plain-English error naming any entry that failed to save. | Attendance | — | 3-Jul |
| `[✅]` | APT-124 | Attendance Entry color coding per client key — each code gets its own cell color (P green, ILL red, PTO orange, H yellow, BRV purple, O pink, IT brown, PD blue) plus a color key legend above the grid | Attendance | — | 3-Jul |
| `[✅]` | APT-125 | Attendance Entry % column rounds to the nearest whole number (.5 and up rounds up, below .5 rounds down) — was showing one decimal (client called this their APT-122) | Attendance | — | 7-Jul |
| `[✅]` | APT-126 | Refreshing the browser on any page showed a 404 NOT_FOUND error — hosting now serves the app for every address so refresh and direct links work on all pages | All | — | 9-Jul |
| `[✅]` | APT-127 | Each Help article now has its own web address (/help/article-name) — opening an article updates the URL, so copying and sharing the link takes the recipient straight to that article instead of the Help home page | Help | — | 9-Jul |
| `[ ]` | APT-128 | Extend metric adjustments (APT-88) to the rollup views — Quarterly, Half-Year, YTD, and Trend tabs should honor per-agent custom goals and exclusions from each month (requires loading the whole year's adjustments, then applying them to the rollup and trend calculations) | Agent Perf | — | — |
| `[✅]` | APT-129 | Display ALL metrics as whole numbers (.5 and up rounds up) — days and hours previously showed two decimals (6.16 days → 6 days, 1.46 hrs → 1 hr); applies across Agent Performance and Team Dashboard, all tabs | Agent Perf / Team | — | 9-Jul |
| `[✅]` | APT-132 | YTD/Quarterly/Half-Year attendance % now day-weighted — total available days ÷ total scheduled days across the period, instead of equally averaging each recorded month's % (which let a 5-day month count as much as a 22-day month) | Agent Perf / Team | — | 11-Jul |
| `[✅]` | APT-133 | Remove the Export and Import buttons from Attendance Entry and Attendance Summary — removed on staging 11-Jul per client request. NOTE: the live site still shows the older Export CSV buttons (APT-121) until this removal is published. | Attendance | — | 11-Jul |
| `[✅]` | APT-134 | YTD/Quarterly/Half-Year attendance showed wrong % (e.g. Emily 100% instead of 92%) once a full year of history was imported — root cause: the year-range attendance query hit Supabase's 1000-row default limit and silently truncated, so most agents' later months were dropped. Now pages through all fact rows. Monthly was unaffected (under the limit). | Agent Perf / Team | — | 21-Jul |
| `[✅]` | APT-135 | Agent Performance context strip — shows the selected agent's **Role**, **Assigned Team(s)**, and **Tenure** (e.g. "4 months in current role") above the rating cards, giving leadership context when judging performance. Role/hire date come from the agent profile; team from active team assignments. Tenure is calculated from **Hire Date** (the only start date the system stores) — if it should measure time in the *current role* specifically, a separate role-start date would need adding. | Agent Perf | — | 21-Jul |
| `[B]` | APT-131 | Weekly performance trend on Agent Performance for the selected month — columns Week 1, Week 2, … (weeks run Monday–Sunday), each metric's weekly actual vs. goal with On/Off Track like Monthly (no tolerance column, no Adjust button); only weeks with real data show. Blocked/PARKED 10-Jul: client says weekly data now exists in the database, but we still need the exact table/view name + columns (and anon-key read access confirmed) from the data team before building. Build on staging first when unblocked. | Agent Perf | M | — | — | — |

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
| `[B]` | APT-130 | Mid-month starters should count for the whole month — agents whose Go-Live Date or team assignment Start Date falls on ANY day of a month should show that month's metrics (today the reports exclude the month unless the dates are on the 1st). Blocked: requires the Supabase admin to update the scorecard/summary/trend views to compare by month, not exact date — SQL request drafted 10-Jul and given to the client to forward. | Agent Perf / Team | S | Update `metrics_vw_ab_scorecard` / `_summary` / `_trends` view definitions (month-granular date comparison) | — | — |
| `[✓]` | APT-91* | Auto-fill Created By (supervisor dropdown; no login system) | Notes | S | Add `created_by` to `metrics_agent_monthly_notes` | Chad | 29-May |
| `[✅]` | APT-88 | Build the metric override feature — UNBLOCKED 8-Jul (client's APT-108 clarified: per-agent custom goals for new hires/PIP + exclude a metric like CSAT). Prototype built: **Adjust** button on each Agent Performance metric row → custom goal or exclude-from-score for that agent+month, with required reason + supervisor. Stored inside the existing monthly supervisor note (no schema change) per client direction. v1 scope: monthly view + that month's rating; rollups later if approach approved. 9-Jul: Notes admin page now shows two separate sections — "Supervisor Notes" (written notes only) and "Metric Adjustments" (agent, month, metric, change, reason, adjusted by) — so adjustments no longer clutter the notes and are easy to track. Tested and published to live 9-Jul. | Agent Perf | L | None — stored in existing notes table | Chad | 8-Jul |
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
| — | June metrics missing for Mindy Sylvester & Jovana (10-Jul) — root cause: their Go-Live Date and team assignment Start Date were June 15, so the database reports treated June as before their start. NOTE for future mid-month hires: reports only include months on/after both dates; set them to the 1st of the month if the whole month should count, and use the Adjust button (APT-88) to soften goals for partial months. | Client set Go-Live + assignment Start to 01-Jun-2026 via the admin pages — no code change needed | Confirmed working 10-Jul |

---

## Recently Pushed — Needs Testing

| APT | What to test |
|-----|-------------|
| APT-46 | Team Dashboard → pick any team + month → the **Goal**, **Tolerance**, and **On Track** columns should appear alongside each metric. Goal values should match the team's scorecard spreadsheet. |
| APT-81 | Admin > Goals → set a goal with a specific Start Date and End Date (day-level, e.g. 2026-06-15 to 2026-07-31) → Agent Perf + Team Dashboard → navigate to that month → Goal and Tolerance should show the values active during those exact dates. |
| APT-84 + APT-85 + APT-110 | Attendance Entry → (1) Check 2+ agent rows → click any cell in the grid → the date column should become selected (not open a popup) → choose a code → "Apply to Selected Cells" should enable and apply. (2) After applying, select cells again and click "Clear Selected Cells" — entries should be removed. (3) Click "US Holidays This Month" → "Apply to all N agents" and "Apply to selected" buttons should apply code H correctly. |
| APT-91 + APT-114 | Agent Perf → supervisor dropdown above Save Note should work; Hide/Show Notes toggle should work; note should save without error. Admin > Notes → Created By shows supervisor name. Note: the `created_by` DB column still needs to be added by Supabase admin — until then notes save but without the supervisor name. |
| APT-109 | Admin > Agents → Edit any agent → **Employment End Date** field should appear. Setting a past date should immediately mark agent inactive. Setting a future date should auto-deactivate when that date arrives. |
| APT-117 | On STAGING: Attendance Entry → **Import CSV** button → choose the `attendance-jan-apr-2026.csv` file Claude provided → confirm the pop-up → success message shows how many entries imported. Then switch the month picker to January/February/March/April 2026 and spot-check a few agents against the Excel tracker. NOTE: imported data lands in the shared database, so it will show on the live site too — the import *button* stays staging-only until published. |
| APT-120 | Agent Performance → pick Brett Jones, June → the **Attendance %** row should now match the Attendance Summary page for June (including the June 26 entry). Team Dashboard → same team + June → Brett's attendance column should match too. Quarterly/YTD/Trend tabs also pick up live attendance. |
| APT-121 | Attendance Entry → **Export CSV** button (top-right of the action row) should download a file with every saved attendance record: Agent, Date, Code, Code Name. Attendance Summary → **Export CSV** button (right of the filter bar) should download Agent, Team, Month, Scheduled Days, Available Days, Attendance % for all months. Both exports include everything, not just the month/team on screen. Files open in Excel. |
| APT-122 | Attendance Entry → enter attendance for **Jovana** and **Mindy**, click Save All Changes, then refresh the page → their entries should still be there. Also check whether those two show up on the **Attendance Summary** page — if they don't, tell me: that part lives in the database and needs the Supabase admin to adjust (likely a missing team assignment). |
| APT-123 | On STAGING, hard-refresh (Ctrl+Shift+R) first. Attendance Entry → June → enter a code on June 26 for Jovana and Mindy → Save All Changes. Either it says "Saved" (then refresh — entries must persist, and June must show them on Attendance Summary too), or a red message names exactly which entries didn't save — report that message word for word. |
| APT-124 | Attendance Entry → a color key row should appear above the grid (one colored chip per code). Cells should be colored by their code per the client's key: P green, ILL red, PTO orange, H yellow, BRV purple, O pink, IT brown, PD blue. Codes not in the key keep the old green/yellow/lavender category colors. |
| APT-125 | Attendance Entry → the **%** column at the end of each agent row should show whole numbers only (e.g. 86% not 85.7%). An agent with 17 of 20 days available should show 85%; one with 17.5/20-style fractions rounds normally (.5 up). |
| APT-126 | On STAGING: open any page (e.g. Help, Attendance Entry) and hit browser refresh — the page should reload normally instead of showing "404 NOT_FOUND". Also try pasting a deep address directly into a new tab. |
| APT-127 | On STAGING: Help & Playbook → open any article → the address bar should change to /help/<article-name>. Copy that URL, open it in a new tab (or send to a teammate) → it should open that exact article. The "← Back to Help" button should return to the article list, and browser back/forward should work naturally. |
| APT-135 | On STAGING: Agent Performance → pick any agent → a grey strip above the rating cards shows Role, Team, and Tenure. Check: (1) Team matches their assignment (multiple teams show comma-separated); (2) Tenure reads sensibly vs their Hire Date; (3) an agent with no hire date shows "Hire date not set" rather than a wrong number; (4) switching agents updates all three. |
| APT-134 | On STAGING (hard-refresh first): Agent Performance → Emily Lloyd → YTD → Attendance % should now read ~92% (was 100%). Cross-check: it should equal total available days ÷ total scheduled days Jan–Jul from the tracker. Verify a few other agents' YTD attendance looks sane too (not all 100%). |
| APT-132 | On STAGING: Agent Performance → YTD tab → Attendance % should equal total available days ÷ total scheduled days over the recorded months (e.g. 40 of 44 days = 91%, even if the two months' individual %s were 100% and 82%). NOTE: agents showing 100% or blank mostly reflect missing historical data — import the Jan–Jul attendance file to make YTD meaningful. |
| APT-129 | On STAGING: Agent Performance → Monthly → "Avg Resolution Days" should read e.g. **6 days** (not 6.16) and "First Reply Time" e.g. **1 hr** (not 1.46). Check the Quarterly/YTD/Trend tabs and the Team Dashboard too — every number should be whole. |
| APT-88 | Agent Performance → pick an agent + month → each metric row has an **Adjust** button. (1) Exclude: pick a metric → Exclude → give a reason → Save → row greys out, says "Excluded", overall rating recalculates without it. (2) Custom goal: pick a metric → set e.g. goal 80 → Save → Goal column shows 80, purple "custom goal" tag appears, status recalculates. Hover the tag/Excluded text to see reason + supervisor. Refresh the page — adjustments must persist. Check Metric Setup > Notes: the page now has TWO sections — "Supervisor Notes" showing only written notes (no adjustment codes), and a "Metric Adjustments" table listing each adjustment with agent, month, metric, change, reason, and who made it. Editing a note there must not disturb its adjustments. Also verify the supervisor note itself still saves/edits normally. |

---

_Last updated: 2026-06-12 — Synced with JIRA CSV export; statuses updated, blocked tasks flagged, APT-110 and APT-114 added_
