# Project History & Handoff — Kipu Support Metrics

_This document is the running memory of the project. It exists so that anyone
picking up this work — a new team lead, a new assistant session, a new
account — has the full story of what has been built, what decisions were made,
and where things stand, without needing the original chat conversations._

**Read this together with:**
- `CLAUDE.md` — how to work on this project and how to talk to the person you're helping
- `TASKS.md` — the live task tracker (the single source of truth for status)
- `help-screenshots.csv` — the checklist of Help-article screenshots still to be taken

_Last updated: 2026-07-02_

---

## 1. The short version

The **Kipu Support Metrics** app is an internal tool for support-team leadership
to track agent performance, attendance, and coaching notes. It's a React + Vite
site backed by a Supabase (PostgreSQL) database, deployed on Vercel.

- **`main`** branch → production site (`kipusupportmetrics.vercel.app`)
- **`chad`** branch → staging site (all in-progress work lives here; this is the
  branch everyone works on and reviews)

Work is organised as **APTs** (numbered tasks) in `TASKS.md`. Client feedback
comes in plain English, gets turned into APTs, and each APT moves through:
To Do → In Progress → Needs Review (pushed to staging) → Complete, or gets
Blocked when it's waiting on client input.

---

## 2. Who's who

- **Chad** — a non-technical trainer at Kipu. Translates client feedback into
  requirements. Does not use Git/code/databases — everything technical is
  handled for him invisibly.
- **Angelique** — leads verification and QA. Owns confirming data accuracy,
  checking tolerances against the Manager Guide, and signing off with
  supervisors. Several tasks are "waiting for Angelique" to confirm a
  description, provide a mockup, or verify data.
- **The client** — support-team leadership at Kipu. Their feedback drives new
  APTs. When a task is **Blocked (`[B]`)**, it means we're waiting on the client
  (or Angelique on the client's behalf) for a decision before we can build it.
- **New team leads** — will use this tool day to day for 1:1 agent reviews, and
  may take over Chad's role of relaying client feedback. This document is
  primarily for them.

---

## 3. What has been built (timeline)

The tool went from an early prototype to a fairly complete internal app over
several rounds of work. Major milestones, roughly in order:

### Foundation
- Core pages built: **Agent Performance** (the 1:1 scorecard view), **Team
  Dashboard**, **Attendance Entry**, **Attendance Summary**, and an **Admin**
  section (Agents, Teams, Team Assignments, Metrics, Goals, Notes).
- Modernised the table UI, added colour-coded ratings, cleaned up layout.

### Group 1 batch (no database changes)
Delivered in a large batch and mostly signed off. Highlights:
- Time-period tabs on Agent Performance: **Monthly / Quarterly / Half-Year /
  YTD / Trend** (APT-41, 48, 49, 50).
- **Overall Rating** shown in the 1:1 header, colour-coded
  Gold / Green / Orange / Red (APT-37, 38).
- **Rating calculation logic** (APT-36/42): counts only metrics flagged
  "counts toward score" that have both data and a goal. Thresholds:
  100% on track = Meets, 75–99% = Needs Improvement, under 75% = Below.
  The "Exceeds" (Gold) tier is built but awaiting final client sign-off.
- Standardised number rounding, removed the outbound-call column, merged the
  two metrics sections, collapsible sidebar, filters that persist across tabs
  and pages, hide/show inactive agents, team-first selection with recalculation.
- Admin: role & team split into dropdowns, team assignments merged into the
  agent profile, multi-team assignment, Reporting Supervisor field.

### Attendance improvements
- Year + Month dropdowns instead of one picker (APT-82).
- Bulk mode: tick agents, select date columns (including click-a-week-header to
  select a whole week), then apply or clear a code across the selection
  (APT-84, 85, 110).
- Holiday panel standardised on the **H** code, with "Apply to all agents" and
  "Apply to selected" (APT-110).

### Goals with history (APT-81)
- Goals now carry **Start Date** and **End Date** at **day-level** precision, so
  a scorecard for any past month shows the target that was actually in effect
  then — not today's target. Implemented as a frontend overlay
  (`getActiveGoals()` filters goals by date range); no database change was
  needed. Also added a delete button and a "Show inactive/expired" filter to the
  Goals admin page.

### Agent lifecycle (APT-109)
- Added **Employment End Date** to the agent profile. When that date passes, the
  agent is automatically set inactive (checked on page load and on save).
  Historical data is preserved. _Requires a database column — see §6._

### Notes (APT-91, APT-114)
- Supervisor notes on the 1:1 view now have a **supervisor dropdown**, a
  **Hide/Show Notes** toggle (to hide notes while screen-sharing with an agent),
  and auto-saved date. There is no login system, so the note's author is chosen
  from a dropdown of supervisors rather than detected automatically.
  _"Created By" name requires a database column — see §6._

### JIRA sync (12-Jun)
- `TASKS.md` was reconciled against a JIRA CSV export: statuses updated, blocked
  tasks flagged with `[B]`, and tasks renumbered to match JIRA
  (the attendance bulk-holiday work is **APT-110**; the note-saving bug is
  **APT-114**). **Blocked (`[B]`) always means "waiting for client input."**

### Help & Playbook section (most recent work)
- Added a new **Help & Playbook** area (sidebar → Support → Help & Playbook, at
  route `/help`) with searchable how-to articles. See §4 for full detail — this
  is the newest piece and has an ongoing screenshot task.

---

## 4. The Help & Playbook section (how it works)

This is the newest feature and the one most likely to need continued attention,
so it's documented in full here.

**What it is:** an in-app help centre with long, illustrated how-to articles and
a **full-text search box** (it searches the whole article body, not just
titles). Reached from the sidebar under **Support → Help & Playbook**.

**Articles currently written (8):**
1. How to Use the Goals Section
2. How to Use the Metrics Section
3. How to Read the Agent Performance Page
4. How to Use the Attendance Page
5. How to Manage Agents
6. How to Use Supervisor Notes
7. How to Manage Teams and Team Assignments
8. How to Read the Attendance Summary Page

**Where the content lives:**
- `src/lib/helpArticles.js` — all article text, as structured "blocks"
  (headings, paragraphs, step lists, bullet lists, callouts, tables, and
  screenshot placeholders). To add or edit an article, edit this file. Each
  article is a plain object with `id`, `title`, `category`, `summary`, and a
  `blocks` array. The block types are documented in a comment at the top of the
  file.
- `src/pages/Help.jsx` — the page that renders the articles and the search.
- `src/index.css` — the Help-specific styles (search box, article cards,
  callouts, screenshot placeholders).

**The screenshot workflow (important, still in progress):**
Articles reference screenshots by a unique ID (**HELP-001** … **HELP-041**).
Rather than block on real screenshots, each one shows a labelled grey
**placeholder** until the real image exists.

- The master list of every screenshot and exactly what it should show lives in
  two places, kept in sync: the `HELP_SCREENSHOTS` array in
  `src/lib/helpArticles.js`, and the **`help-screenshots.csv`** checklist in the
  project root (this is the file handed to Chad to work through).
- To replace a placeholder with a real screenshot: take the screenshot, save it
  as `<ID>.jpg` (e.g. `HELP-029.jpg`), and drop it into the
  **`public/help-images/`** folder. The Help page automatically shows the image
  once the file exists — **no code change is needed.**
- As of this writing, all 41 screenshots are still placeholders awaiting real
  images.

**If you add a new article:** add its object to `ARTICLES`, add any new
screenshot rows to both `HELP_SCREENSHOTS` and `help-screenshots.csv` using the
next free HELP-0xx numbers, then commit and push.

---

## 5. Current state — what's done, waiting, and blocked

`TASKS.md` is always the authoritative status. As a snapshot at the time of this
writing:

- **Done and signed off (`[✅]`):** most of the Group 1 batch — ratings, tabs,
  YTD/trend, leaderboard, attendance dropdowns, admin dropdowns, role-based
  goals, per-team metric toggling.
- **Pushed, awaiting review (`[✓]`):** APT-46 (goal/tolerance columns on Team
  Dashboard, pending data verification), APT-81 (day-level goal dates), the
  attendance bulk fixes (APT-84/85/110), and the notes fixes (APT-91/114).
  See the "Recently Pushed — Needs Testing" section of `TASKS.md` for exactly
  what to click to test each.
- **Blocked, waiting on client/Angelique (`[B]`):**
  - APT-39 — AI performance summary (waiting for final description)
  - APT-63 — bring back the trending view (waiting for rules on how to define
    "maintaining", what trend arrows compare against, and mid-period goal
    changes)
  - APT-83 — "All Months" bulk option (waiting to clarify which section)
  - APT-88 — metric override feature (waiting to clarify what "override" means)
  - APT-92 — AI referencing supervisor notes (may overlap with APT-39/63)
  - APT-94 — verify tolerances vs. the Manager Guide (dev team needs Confluence
    access; Chad to grant)
- **On hold:** APT-62 (full-screen width) — Trend and Team Dashboard tables were
  widened; the rest is paused until Angelique shares an HTML mockup.
- **Data verification open:** APT-46 goal values in the database still need
  checking against the team scorecard spreadsheets (Billing, RCM, CRM) that were
  shared 12-Jun.

---

## 6. Database changes still needed (for a Supabase admin)

Two features are built in the app but need a database column added by whoever
administers Supabase. Until these run, the features degrade gracefully (they
don't error, they just can't store that one field):

```sql
-- APT-109: lets an agent auto-deactivate on their employment end date
ALTER TABLE metrics_agents
  ADD COLUMN IF NOT EXISTS employment_end_date date;

-- APT-91 / APT-114: stores which supervisor wrote a note
ALTER TABLE metrics_agent_monthly_notes
  ADD COLUMN IF NOT EXISTS created_by text;
```

Other schema-change tasks (APT-90 private notes, APT-88 overrides) are tracked
in Group 2 of `TASKS.md` and are not yet built.

---

## 7. How the day-to-day workflow runs

1. Client feedback arrives in plain English.
2. It becomes an APT (new number if new, or an update to an existing one) in
   `TASKS.md`.
3. Small changes are built immediately, committed, and pushed to the **`chad`**
   branch; the staging site updates within about a minute.
4. Each pushed task gets a **Test:** note in `TASKS.md` saying exactly what to
   click to check it. The reviewer (Angelique or Chad) tests on staging and
   replies pass / issue.
5. Pass → marked Complete `[✅]`. Issue → logged in the Rework Log, fixed,
   re-pushed.
6. Complex or unclear requests are added to `TASKS.md` and flagged, not built
   blind.

The person you're assisting is **non-technical** — never surface Git, branches,
commits, or code to them. Just do the work and tell them, in plain English,
what changed. (`CLAUDE.md` has the full standing rules.)

---

## 8. A note on "conversation history"

The chat transcripts from earlier work do **not** transfer between accounts or
sessions — an assistant only knows what's written into the project's files. This
document, plus `CLAUDE.md` and `TASKS.md`, **is** that written memory. When
something meaningful is decided or delivered, capture it here so the next person
picking up the project starts fully informed.
</content>
