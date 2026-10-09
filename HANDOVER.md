# Handover Briefing — Kipu Support Metrics

_Written 2026-10-09 for the incoming project owner._

**Read this together with:**
- `PROJECT_HISTORY.md` — the long-form narrative of what was built and why
- `TASKS.md` — the live task tracker (single source of truth for status)
- `CLAUDE.md` — how AI assistants are configured to work on this project

> This is a point-in-time snapshot. Where something could not be verified from the
> codebase, it is flagged with ⚠️ rather than guessed at.

---

## 1. Purpose

**Kipu Support Metrics** is an internal tool for a customer-support team's leadership.
It shows each agent's monthly performance scorecard (tickets solved, CSAT, reply-time
SLAs, attendance), rolls those up into team dashboards and quarterly/YTD views, tracks
daily attendance, and stores supervisors' coaching notes. Supervisors use it in 1:1
reviews; managers use the team dashboard. It is a **reporting and data-entry tool, not a
data source** — most numbers are produced elsewhere and loaded in.

---

## 2. Tech stack

| Layer | What's used |
|---|---|
| Frontend | React 19 + Vite, React Router 7 |
| Styling | Hand-written CSS in `src/index.css` (Tailwind is installed but barely used — treat the CSS file as the source of truth) |
| Backend | **None of our own.** The browser talks to the database directly |
| Database | Supabase (hosted PostgreSQL) |
| Hosting | Vercel, auto-deploys from GitHub |
| Auth | **None — see Gotchas** |
| Notable library | `xlsx` — now unused leftover (see Gotchas) |

**There is no AI in the product.** Metrics named "% AI Suggestions Accepted" measure
agents' own AI tool usage; they're ordinary numbers. AI features were requested but never
built (APT-39/45/92, still blocked).

---

## 3. Architecture

```
Zendesk / other sources  →  [UNKNOWN PROCESS]  →  Supabase  ←→  React app in browser  →  Vercel
```

- Every screen calls a function in **`src/lib/api.js`**, which queries Supabase directly.
  There's no middle tier, so `api.js` is effectively the whole backend.
- The database has **tables** (records) and **views** (saved queries that pre-build
  scorecards): `metrics_vw_ab_scorecard`, `_summary`, `_trends`, plus `metrics_agents`,
  `metrics_fact_attendance_daily`, `metrics_group_goals`, `metrics_agent_monthly_notes`,
  `metrics_cfg_attendance_codes`, and a few others.
- **The app only writes** attendance, notes, agents/teams/goals/metrics config and
  attendance codes. Performance metrics are read-only — they arrive pre-loaded.
- Over time, calculation logic has **migrated out of the database views into the app**
  (ratings, on/off-track, attendance rollups). The views still compute their own versions,
  which the app now overrides. Worth knowing when numbers disagree.

---

## 4. Environments

| | Branch | Who uses it |
|---|---|---|
| Staging | `chad` | You, for testing |
| Live | `main` | The whole team — `kipusupportmetrics.vercel.app` |

- **Both share ONE database.** Code is separate; data is not. Any record you add or edit
  on staging appears on live instantly. This surprises people regularly.
- Deploys are automatic: push to a branch → Vercel rebuilds that site in ~1 minute.
- Publishing = copying tested changes from `chad` to `main`. Convention here is to publish
  **only the specific files for the approved task**, not everything on staging, because
  staging sometimes holds deliberately-parked work.
- `vercel.json` contains a rewrite rule so page refreshes don't 404 — don't delete it.

---

## 5. Key folders and files

| To change… | Look at |
|---|---|
| A screen | `src/pages/` — `AgentPerformance.jsx` (943 lines, the big one), `LeaderDashboard.jsx`, `AttendanceEntry.jsx`, `AttendanceSummary.jsx`, `Help.jsx` |
| Admin screens | `src/pages/admin/` — agents, teams, team assignments, metrics, goals, notes, attendance codes |
| Any database query | `src/lib/api.js` |
| Number formatting, ratings | `src/lib/format.js` (incl. `NEW_RATING_BANDS_FROM = '2026-07'`) |
| Help articles | `src/lib/helpArticles.js`; images in `public/help-images/` |
| Menu / navigation | `src/components/Layout.jsx` |
| Attendance codes (LOA etc.) | **Not in code** — they're database records, edited via the Attendance Codes screen in the app. Only the cell colours are in code (`CODE_COLORS` in `AttendanceEntry.jsx`) |

Also read `CLAUDE.md` — it configures how AI assistants behave on this project
(staging-first, plain English, etc.).

---

## 6. Integrations and credentials

You'll need access to:

- **GitHub** — `github.com/pparikh73/kipusupportmetrics`
- **Vercel** — hosting, and where the environment variables live
- **Supabase** — the database. _Essential:_ several tasks are blocked purely for lack of it
- **Zendesk** — ⚠️ only if you need to trace where metrics come from

Environment variables (names only, both set in Vercel; `.env.example` documents them):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

⚠️ Both are **public** — they ship inside the browser bundle. That's normal for Supabase
_when row-level security is configured_; this could not be verified from the codebase.
**Check this early.**

No MCP connectors or third-party API keys are used by the app itself.

---

## 7. Tracker and workflow

`TASKS.md` in the repo root is the tracker. Tasks are "APT-nnn". **Phase 2 is active**
(since 21 Jul 2026); Phase 1 closed at APT-135 and its tables are historical. New tasks go
in the Phase 2 section at the top, numbered from APT-136, tagged `P2`.

Statuses: `[ ]` to do · `[~]` in progress · `[✓]` on staging awaiting test ·
`[✅]` tested and live · `[B]` blocked.

The loop: request → build → push to `chad` → requester tests on staging → they approve →
publish to `main` → mark `[✅]`. Counts as of this writing: **14 not started, 7 blocked,
7 awaiting test sign-off, 1 in progress**.

`PROJECT_HISTORY.md` is the long-form narrative — read it alongside this.

---

## 8. Gotchas

### Significant

1. **No login. At all.** A search of the codebase found zero authentication code. Anyone
   with the URL can view every agent's performance data *and edit it* — including
   attendance, goals and notes. For a tool holding individual performance records this is
   the thing to escalate first. ⚠️ It is unknown whether this is mitigated at the network
   level (VPN/SSO in front of Vercel) — **verify**.
2. **Staging and live share a database.** "Test on staging" only isolates *code*, never
   data.
3. **The Zendesk → database pipeline is undocumented and not in this repo.** ⚠️ Nobody has
   documented who runs it, on what schedule, or how "% Solved in 1 Day" is defined. New
   agents show blank metrics until someone adds them to that process.
4. **Database views can't be edited from the app.** APT-130 and APT-114 have been blocked
   for months waiting on a Supabase admin. The SQL is already drafted in the task notes.
5. **The 1,000-row query cap.** Supabase returns max 1,000 rows per query by default. This
   silently corrupted YTD attendance once (APT-134) and was fixed only for the attendance
   rollup. Other year-range queries may hit it as data grows — easy to miss because it
   fails *quietly*.

### Smaller

6. Metric adjustments (custom goals/exclusions) are stored **inside the supervisor note
   text** behind a `[[ADJUSTMENTS]]` marker, not their own table. It works, but it's
   unusual — don't hand-edit notes in the database.
7. Rating bands change behaviour at **July 2026** (`NEW_RATING_BANDS_FROM`). Same
   performance reads a band higher from that month on.
8. **No tests whatsoever.** Verification is manual, via staging. `npm run lint` has
   pre-existing errors — don't read them as new breakage.
9. **Dead code**: `src/components/AdminTable.jsx`, `src/assets/hero.png`,
   `public/icons.svg` are unreferenced, and `src/lib/csv.js` + the `xlsx` dependency are
   unused since the import/export buttons were removed (APT-133).
10. The branch `chad` is a person's name, not a keyword — it means staging. There's also a
    stray `claude/project-history-claude-docs-c9llcb` branch that can be ignored.

### Open TODOs

- **Help & Playbook attendance article doesn't mention LOA** or the Attendance Codes
  screen (confirmed: zero mentions of "LOA" across all 9 articles).
- No Help article explains how Overall Rating is calculated — supervisors have nothing to
  point to when an agent asks "why this rating?"
- 7 tasks sit at "awaiting test" with no sign-off; several blocked items date to early June
  and may be stale enough to close.

---

## 9. First-week checklist

**Get access:** GitHub, Vercel, Supabase, and the Help site itself. Ask who owns the
Zendesk data load.

**Read, in order:** `PROJECT_HISTORY.md` → `TASKS.md` (Phase 2 section) → `CLAUDE.md` →
`src/lib/api.js`.

**Verify these three things early:**

1. Is there any access control in front of the live site? (Gotcha #1)
2. Is row-level security enabled in Supabase? (Section 6)
3. Who produces the monthly metrics, and how does a new agent get added to it? (Gotcha #3)

**Test the main flows on staging:** open an agent's scorecard across
Monthly/Quarterly/YTD/Trend; enter and save attendance; add a metric adjustment via the
Adjust button and watch the rating change; open Attendance Codes.

**Do one small change end-to-end** — something cosmetic — to feel the push → staging →
publish loop.

**Chase the two blocked database items** (APT-130, APT-114) — drafted SQL is waiting and
they're quick wins.

---

## Unverified items

Two things could not be determined from the codebase and should not be assumed:

- **Whether anything restricts access to the live site** (Gotcha #1)
- **How the Zendesk-to-database pipeline works** (Gotcha #3)

Everything else in this document was verified against the code on 2026-10-09.
