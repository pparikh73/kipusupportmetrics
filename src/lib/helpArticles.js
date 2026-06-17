// Help / Playbook article content for the Kipu Support Metrics tool.
//
// Each article is a list of "blocks" that the Help page renders. Supported blocks:
//   { type: 'h2', text }                              section heading
//   { type: 'p', text }                               paragraph (supports **bold** inline)
//   { type: 'steps', items: [..] }                    numbered steps
//   { type: 'list', items: [..] }                     bullet list
//   { type: 'callout', variant: 'info'|'tip'|'warning', text }
//   { type: 'shot', id: 'HELP-001', caption }         screenshot placeholder (see public/help-images)
//   { type: 'table', headers: [..], rows: [[..]] }    simple table
//
// Screenshot workflow: every { type: 'shot' } has a unique id. The page first tries to
// load /help-images/<id>.jpg; if the file isn't there yet it shows a labelled placeholder.
// The full list of screenshots + what each should show lives in HELP_SCREENSHOTS below.

export const ARTICLES = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'goals',
    title: 'How to Use the Goals Section',
    category: 'Setup',
    summary:
      'Add and manage the target each team is measured against for every metric, set tolerances, schedule goal changes with start/end dates, and handle expired or inactive goals.',
    blocks: [
      { type: 'h2', text: 'What a goal is, and why you set one' },
      {
        type: 'p',
        text:
          'A **goal** is the target a team is expected to hit for a single metric — for example, "CSAT % should be at least 96%" or "Average Resolution Time should be 5 days or fewer". Every metric on an agent or team scorecard is judged **On Track** or **Off Track** by comparing the actual result against the goal you set here.',
      },
      {
        type: 'p',
        text:
          'Goals are set **per team**, so the Billing team can have a different target than the CRM team for the same metric. If a metric has no goal for a team, the scorecard simply shows "No Goal" for it and it does not count for or against the rating.',
      },
      { type: 'shot', id: 'HELP-001', caption: 'The Goals page showing goals grouped by team.' },

      { type: 'h2', text: 'When would you add a goal?' },
      { type: 'p', text: 'You will typically add a goal in one of these situations:' },
      {
        type: 'list',
        items: [
          'A new team is onboarded and needs its targets defined.',
          'A new metric is introduced and each team needs a target for it.',
          'Leadership changes the target mid-year (for example, raising CSAT from 94% to 96%). In that case you end the old goal and start a new one — see "Changing a goal over time" below.',
        ],
      },

      { type: 'h2', text: 'Adding a goal — step by step' },
      {
        type: 'steps',
        items: [
          'Click the blue **+ Add Goal** button in the top-right of the Goals page.',
          'Fill in each field in the pop-up (explained below).',
          'Click **Save**. The new goal appears immediately under its team.',
        ],
      },
      { type: 'shot', id: 'HELP-002', caption: 'The + Add Goal button in the top-right corner.' },
      { type: 'shot', id: 'HELP-003', caption: 'The Add Goal pop-up with all of its fields.' },

      { type: 'h2', text: 'Every field explained' },
      {
        type: 'table',
        headers: ['Field', 'What it means'],
        rows: [
          ['Team', 'Which team this goal applies to. Each team is set separately.'],
          ['Metric', 'Which metric this goal is for (e.g. CSAT %, Call Accept %). Only active metrics appear in this list.'],
          ['Goal Value', 'The target number. For a percentage metric enter the number only (e.g. 96 for 96%). For a days metric enter the number of days (e.g. 5).'],
          ['Tolerance (±)', 'Optional. How much wiggle room is allowed before a result is counted as Off Track. See "How tolerance works" below. Leave blank for no tolerance.'],
          ['Start Date', 'The first day this goal is in effect. Leave blank if it has always applied.'],
          ['End Date', 'The last day this goal is in effect. Leave blank if the goal is still current (most goals).'],
          ['Active', 'A simple on/off switch. Unchecking it hides the goal from scorecards without deleting it.'],
        ],
      },

      { type: 'h2', text: 'How tolerance works behind the scenes' },
      {
        type: 'p',
        text:
          'Tolerance is the buffer around the goal value that still counts as **On Track**. Whether the buffer is added or subtracted depends on the **direction** of the metric (set in the Metrics section):',
      },
      {
        type: 'list',
        items: [
          'For "higher is better" metrics (like CSAT % or Call Accept %), the tolerance is **subtracted**. Goal 96% with a tolerance of 2% means anything **at or above 94%** is On Track.',
          'For "lower is better" metrics (like Average Resolution Time), the tolerance is **added**. Goal 5 days with a tolerance of 1 day means anything **at or below 6 days** is On Track.',
        ],
      },
      {
        type: 'table',
        headers: ['Metric', 'Goal', 'Tolerance', 'On Track when…'],
        rows: [
          ['CSAT %', '96%', '±2%', 'actual is 94% or higher'],
          ['Call Accept %', '85%', '±2%', 'actual is 83% or higher'],
          ['Attendance %', '95%', '±10%', 'actual is 85% or higher'],
          ['Avg Resolution Time', '5 days', '±1 day', 'actual is 6 days or fewer'],
          ['Articles Created', '3', '(none)', 'actual is 3 or more'],
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text:
          'Tolerance is optional. If you leave it blank, the agent must hit the exact goal value (or better) to be On Track.',
      },
      { type: 'shot', id: 'HELP-004', caption: 'A scorecard showing Goal, Tolerance and On Track / Off Track status side by side.' },

      { type: 'h2', text: 'Changing a goal over time (mid-year changes)' },
      {
        type: 'p',
        text:
          'Targets sometimes change partway through the year. The tool keeps your history correct by letting each goal carry a **Start Date** and **End Date**, right down to the specific day.',
      },
      {
        type: 'p',
        text:
          'Example: CSAT was 94% from January, then raised to 96% starting 15 June. You would: (1) edit the old 94% goal and set its **End Date** to 14 June; (2) add a new 96% goal with a **Start Date** of 15 June and no end date. Now when someone views a January–May scorecard they see the 94% target, and from mid-June onward they see 96%.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text:
          'Because performance is reviewed monthly, try to start and end goals on month boundaries when you can. Changing a goal in the middle of a month means that single month is judged against whichever goal overlapped it.',
      },

      { type: 'h2', text: 'Filtering and finding goals' },
      { type: 'p', text: 'The filter bar at the top of the page helps you focus on the goals you care about:' },
      {
        type: 'list',
        items: [
          '**Team** — show goals for one team only.',
          '**From Date / To Date** — show only goals that were active within a date range.',
          '**Show expired** — by default, goals whose End Date is in the past are hidden. Tick this to see them.',
          '**Show inactive** — by default, goals with the Active switch turned off are hidden. Tick this to see them.',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text:
          'Your filter choices are remembered automatically, so the page looks the same the next time you open it.',
      },
      { type: 'shot', id: 'HELP-005', caption: 'The Goals filter bar: Team, From/To Date, Show expired, Show inactive.' },

      { type: 'h2', text: 'Expired vs. inactive goals — what is the difference?' },
      {
        type: 'list',
        items: [
          '**Expired** = a goal that had an End Date in the past. It still counts for the months it was active, it is just no longer current. Use "Show expired" to view these.',
          '**Inactive** = a goal whose Active switch was turned off. It is excluded from scorecards entirely. Use "Show inactive" to view these.',
        ],
      },

      { type: 'h2', text: 'Editing or deleting a goal' },
      {
        type: 'steps',
        items: [
          'Find the goal in the list and click **Edit** on its row.',
          'Change any field and click **Save**, OR',
          'To remove it permanently, click the red **Delete Goal** button at the bottom-left of the pop-up and confirm.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text:
          'Deleting a goal cannot be undone, and it removes that goal from past scorecards too. If you only want to stop a goal going forward, set its End Date or untick Active instead of deleting it.',
      },
      { type: 'shot', id: 'HELP-006', caption: 'The Edit Goal pop-up with the red Delete Goal button.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'metrics',
    title: 'How to Use the Metrics Section',
    category: 'Setup',
    summary:
      'Define the things the tool tracks — what a metric is, the difference between scored and additional metrics, how to add one and what each field means, and how to retire a metric without losing its history.',
    blocks: [
      { type: 'h2', text: 'What a metric is, and why it matters' },
      {
        type: 'p',
        text:
          'A **metric** is a single thing you measure about performance — CSAT %, Call Accept %, Average Resolution Time, Articles Created, and so on. Metrics are the building blocks of every scorecard: each one shows the agent or team\'s actual result, and (if a goal exists) whether they are On Track.',
      },
      {
        type: 'p',
        text:
          'You define a metric **once** here in the Metrics section. After that, you can set a per-team target for it in the Goals section, and it will appear on the dashboards.',
      },
      { type: 'shot', id: 'HELP-007', caption: 'The Metrics page, with metrics grouped into Scored, Additional, and Inactive sections.' },

      { type: 'h2', text: 'Scored vs. additional metrics' },
      {
        type: 'p',
        text:
          'Every metric is either **scored** or **additional**, controlled by the "Counts Toward Score" switch:',
      },
      {
        type: 'list',
        items: [
          '**Scored metrics** count toward the agent\'s Overall Rating (Meets Expectations / Needs Improvement / Below Expectations). These are the metrics leadership holds the team accountable for.',
          '**Additional metrics** are shown for context and awareness but do **not** affect the Overall Rating. Use these for numbers you want visible but are not formally grading.',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text:
          'The Overall Rating is worked out as a percentage of scored metrics that are On Track: 100% On Track = Meets Expectations, 75–99% = Needs Improvement, below 75% = Below Expectations. Because it is a percentage, the rating stays correct even as you add or remove scored metrics.',
      },
      { type: 'shot', id: 'HELP-010', caption: 'The Scored Metrics and Additional Metrics sections on the Metrics page.' },

      { type: 'h2', text: 'Adding a metric — step by step' },
      {
        type: 'steps',
        items: [
          'Click the blue **+ Add Metric** button near the top of the page.',
          'Fill in each field in the pop-up (explained below).',
          'Click **Save**. The metric appears in the matching section.',
        ],
      },
      { type: 'shot', id: 'HELP-008', caption: 'The + Add Metric button.' },
      { type: 'shot', id: 'HELP-009', caption: 'The Add Metric pop-up with all of its fields.' },

      { type: 'h2', text: 'Every field explained' },
      {
        type: 'table',
        headers: ['Field', 'What it means'],
        rows: [
          ['Metric Name', 'The friendly name shown everywhere in the tool (e.g. "CSAT %").'],
          ['Key', 'A short internal code in snake_case (e.g. "csat_pct"). It links the metric to the underlying data, so it must be unique and is usually set once and left alone.'],
          ['Unit Type', 'How the number is displayed: Count, Percent, Days, or Hours.'],
          ['Direction Good', 'Which way is good. "At or Above" = higher is better (CSAT). "At or Below" = lower is better (Resolution Time). This also decides whether tolerance is subtracted or added.'],
          ['Display Order', 'Controls the order metrics appear in. Lower numbers show first.'],
          ['Counts Toward Score', 'On = scored metric (affects rating). Off = additional metric (shown only).'],
          ['Active', 'On = the metric is in use. Off = retired/hidden (see below).'],
        ],
      },
      { type: 'shot', id: 'HELP-011', caption: 'The Counts Toward Score and Active checkboxes in the metric pop-up.' },

      { type: 'h2', text: 'Making a metric inactive (retiring it)' },
      {
        type: 'p',
        text:
          'When a metric is no longer used, untick its **Active** switch instead of deleting it. An inactive metric:',
      },
      {
        type: 'list',
        items: [
          'Moves to the "Inactive Metrics" section on this page.',
          'Disappears from agent and team scorecards going forward.',
          'Drops out of the Overall Rating automatically — the rating recalculates against the metrics that remain.',
          'Keeps its history, so past months you already recorded are not lost.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text:
          'Turning a metric off is the safe way to retire it. You can always turn it back on later and everything reappears exactly as before.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'agent-performance',
    title: 'How to Read the Agent Performance Page',
    category: 'Daily Use',
    summary:
      'The 1:1 view supervisors use most: pick a team and agent, read the Overall Rating, switch between Monthly / Quarterly / Half-Year / YTD / Trend, understand the goal vs. actual columns, and record a coaching note.',
    blocks: [
      { type: 'h2', text: 'What this page is for' },
      {
        type: 'p',
        text:
          'The **Agent Performance** page is the main screen used during a 1:1 between a supervisor and an agent. It shows one agent\'s scorecard, their Overall Rating, and how they are trending — everything needed for a monthly review in one place.',
      },

      { type: 'h2', text: 'Choosing what you are looking at' },
      {
        type: 'steps',
        items: [
          'Pick a **Team** from the filter bar. The agent list then shows only that team\'s agents.',
          'Pick an **Agent**.',
          'Pick the **Year** and **Month** you want to review.',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text:
          'These filter choices are remembered as you move between pages, so you do not have to re-select your team and agent every time.',
      },
      { type: 'shot', id: 'HELP-012', caption: 'The Agent Performance filter bar (Team, Agent, Year, Month).' },

      { type: 'h2', text: 'The Overall Rating' },
      {
        type: 'p',
        text:
          'At the top of the page you will see the agent\'s **Overall Rating** for the selected month, colour-coded so it is readable at a glance:',
      },
      {
        type: 'list',
        items: [
          '**Gold — Exceeds Expectations**',
          '**Green — Meets Expectations** (all scored metrics On Track)',
          '**Orange — Needs Improvement** (75–99% of scored metrics On Track)',
          '**Red — Below Expectations** (under 75% On Track)',
        ],
      },
      { type: 'shot', id: 'HELP-013', caption: 'The Overall Rating shown in the page header.' },

      { type: 'h2', text: 'The time-period tabs' },
      {
        type: 'p',
        text:
          'Use the tabs to change the period you are reviewing:',
      },
      {
        type: 'table',
        headers: ['Tab', 'Shows'],
        rows: [
          ['Monthly', 'The selected single month in full detail.'],
          ['Quarterly', 'Results grouped into the four quarters (Q1–Q4).'],
          ['Half-Year', 'Results grouped into the two halves (H1, H2).'],
          ['YTD', 'Year-to-date totals up to the selected month.'],
          ['Trend', 'A month-by-month view so you can see direction of travel.'],
        ],
      },
      { type: 'shot', id: 'HELP-014', caption: 'The Monthly / Quarterly / Half-Year / YTD / Trend tabs.' },

      { type: 'h2', text: 'Reading the scorecard columns' },
      {
        type: 'p',
        text:
          'For each metric the table shows the **actual** result alongside the **Goal**, the **Tolerance**, and an On Track / Off Track status. The goal shown is always the one that was in effect for the month you are viewing — so a backdated month correctly shows the target that applied back then, not today\'s target.',
      },
      {
        type: 'list',
        items: [
          '**On Track** (green) — the agent met the goal (within tolerance).',
          '**Off Track** (red) — the agent missed the goal.',
          '**No Goal** (grey) — no target is set for this metric/team, so it does not affect the rating.',
          '**No Data** (grey) — no result was recorded for this metric this month.',
        ],
      },
      { type: 'shot', id: 'HELP-015', caption: 'A monthly scorecard row showing Actual, Goal, Tolerance and Status.' },

      { type: 'h2', text: 'The Trend view' },
      {
        type: 'p',
        text:
          'The **Trend** tab lays out each metric across the recent months so you can quickly see whether an agent is improving, holding steady, or slipping over time.',
      },
      { type: 'shot', id: 'HELP-016', caption: 'The Trend tab showing month-by-month results per metric.' },

      { type: 'h2', text: 'Recording a coaching note' },
      {
        type: 'steps',
        items: [
          'Scroll to the **Supervisor Note** card for the selected month.',
          'Choose your name from the **Supervisor** dropdown.',
          'Type the note and click **Save Note**. The date and your name are saved with it.',
          'Use **Hide Notes / Show Notes** to hide the note section while screen-sharing with the agent if you do not want it visible.',
        ],
      },
      { type: 'shot', id: 'HELP-017', caption: 'The Supervisor Note card with the supervisor dropdown, Save Note, and Hide/Show toggle.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'attendance',
    title: 'How to Use the Attendance Page',
    category: 'Daily Use',
    summary:
      'Record daily attendance: choose a month, fill in a single cell, or use the bulk tools to apply a code to many agents and dates at once — including marking a holiday for the whole team.',
    blocks: [
      { type: 'h2', text: 'What this page is for' },
      {
        type: 'p',
        text:
          'The **Attendance Entry** page is a grid of agents (rows) against the days of the month (columns). You record each agent\'s status per day using short codes — for example **P** (present), **A** (absent), **PTO**, and **H** (holiday).',
      },

      { type: 'h2', text: 'Choosing the month' },
      {
        type: 'p',
        text:
          'Use the **Year** and **Month** dropdowns at the top to load the grid for the period you want. Inactive agents are hidden by default; tick **Show inactive** if you need them.',
      },
      { type: 'shot', id: 'HELP-018', caption: 'The attendance grid with the Year and Month selectors.' },

      { type: 'h2', text: 'Filling in a single day for one agent' },
      {
        type: 'steps',
        items: [
          'Make sure no agent checkboxes are ticked (this keeps you in single-cell mode).',
          'Click the cell where the agent\'s row meets the day\'s column.',
          'Pick the code in the small pop-up. The cell updates straight away.',
        ],
      },
      { type: 'shot', id: 'HELP-019', caption: 'Clicking a single cell to set one agent\'s code for one day.' },

      { type: 'h2', text: 'Applying a code to many agents and days at once' },
      {
        type: 'p',
        text:
          'When you need to set the same code for several agents and/or several days, use bulk mode:',
      },
      {
        type: 'steps',
        items: [
          'Tick the checkbox next to each agent you want to include.',
          'Click cells in the grid to select the date columns — selected dates highlight. (Tip: click a **week header** to select that whole week at once.)',
          'Choose the code and click **Apply to Selected Cells**. It fills every selected agent/date combination.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text:
          'Once one or more agents are ticked, clicking a cell selects its date instead of opening the single-cell pop-up. If you only see the pop-up, it means no agents are ticked.',
      },
      { type: 'shot', id: 'HELP-020', caption: 'Bulk mode: agents ticked on the left and date columns highlighted.' },
      { type: 'shot', id: 'HELP-021', caption: 'Clicking a week header to select an entire week.' },

      { type: 'h2', text: 'Marking a holiday for the whole team' },
      {
        type: 'p',
        text:
          'For an observed holiday, use the holiday panel. It applies the **H** code (the tool standardises on H):',
      },
      {
        type: 'list',
        items: [
          '**Apply to all agents** — marks the holiday for every agent shown.',
          '**Apply to selected** — marks the holiday only for the agents you have ticked. (This button is greyed out until at least one agent is ticked.)',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text:
          'For a one-off observed day that is not in the default holiday list (for example an EQX holiday), just select the date column(s) in the grid and apply the H code in bulk.',
      },
      { type: 'shot', id: 'HELP-022', caption: 'The holiday panel with Apply to all agents and Apply to selected.' },

      { type: 'h2', text: 'Clearing entries' },
      {
        type: 'p',
        text:
          'To remove entries in bulk, tick the agents, select the date cells, and click **Clear Selected Cells**. This empties those cells (removing saved entries as well as ones you have not saved yet).',
      },
      { type: 'shot', id: 'HELP-023', caption: 'The Clear Selected Cells button.' },

      {
        type: 'callout',
        variant: 'info',
        text:
          'Attendance is saved to the database and will still be there when you come back in a later session.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'agents',
    title: 'How to Manage Agents',
    category: 'Setup',
    summary:
      'Add and maintain agent profiles: set their role and reporting supervisor, assign them to teams, record hire / go-live / employment end dates, and understand how active vs. inactive affects the dashboards.',
    blocks: [
      { type: 'h2', text: 'What this page is for' },
      {
        type: 'p',
        text:
          'The **Agents** page (under People & Assignment) is where every person tracked by the tool is set up. The header shows a running count of total, active, and inactive agents.',
      },
      { type: 'shot', id: 'HELP-024', caption: 'The Agents list with the Search box and Status filter.' },

      { type: 'h2', text: 'Finding an agent' },
      {
        type: 'list',
        items: [
          'Use the **Search** box to filter by name.',
          'Use the **Status** dropdown to show All, Active only, or Inactive only.',
        ],
      },

      { type: 'h2', text: 'Adding a new agent' },
      {
        type: 'steps',
        items: [
          'Click **+ Add Agent** in the top-right.',
          'Fill in the fields in the pop-up (explained below).',
          'Click **Save**.',
        ],
      },
      { type: 'shot', id: 'HELP-025', caption: 'The + Add Agent button.' },
      { type: 'shot', id: 'HELP-026', caption: 'The agent profile pop-up with all of its fields.' },

      { type: 'h2', text: 'Every field explained' },
      {
        type: 'table',
        headers: ['Field', 'What it means'],
        rows: [
          ['Agent Name', 'The person\'s name as it appears throughout the tool.'],
          ['Role', 'Their role: Support Specialist, PSA, Team Lead, Supervisor, Manager, Trainer, or Other.'],
          ['Reporting Supervisor', 'Who this agent reports to. The list is drawn from people whose role is Supervisor.'],
          ['Hire Date', 'When the agent was hired.'],
          ['Go-Live Date', 'When the agent started taking live work (used so brand-new agents are not judged on ramp-up time).'],
          ['Employment End Date', 'Their last day, if known. See below — this auto-deactivates the agent when the date passes.'],
          ['Notes', 'Free text for anything useful about the agent.'],
          ['Active', 'Whether the agent currently appears on the dashboards.'],
        ],
      },

      { type: 'h2', text: 'The Employment End Date field' },
      {
        type: 'p',
        text:
          'Setting an **Employment End Date** lets the tool retire an agent automatically:',
      },
      {
        type: 'list',
        items: [
          'If the date is in the **past**, the agent is marked inactive right away when you save.',
          'If the date is in the **future**, the agent stays active until that day, then is automatically switched to inactive (the check runs whenever the app is opened).',
          'Their historical data is preserved, so past months still show their results.',
        ],
      },
      { type: 'shot', id: 'HELP-027', caption: 'The Employment End Date field on the agent profile.' },

      { type: 'h2', text: 'Active vs. inactive' },
      {
        type: 'p',
        text:
          'The **Active** switch controls visibility. Active agents appear on the Agent Performance, Team Dashboard, and Attendance pages. Inactive agents are hidden from those dashboards but keep all of their history, so nothing is lost — you are just tidying up the everyday views.',
      },

      { type: 'h2', text: 'Assigning an agent to teams' },
      {
        type: 'p',
        text:
          'Once an agent has been saved, a **Team Assignments** section appears at the bottom of their profile. An agent can belong to more than one team.',
      },
      {
        type: 'steps',
        items: [
          'Open the agent\'s profile (it must already be saved).',
          'In the Team Assignments section, pick a team under **Add Team**.',
          'Optionally enter the month it takes effect (format YYYY-MM, e.g. 2026-01).',
          'Click **Add**. To remove an assignment, click **Remove** next to it.',
        ],
      },
      { type: 'shot', id: 'HELP-028', caption: 'The Team Assignments section at the bottom of the agent profile.' },
    ],
  },
]

// Master list of every screenshot placeholder — used to generate the CSV checklist
// and so each placeholder has a human-readable description in one place.
export const HELP_SCREENSHOTS = [
  { id: 'HELP-001', article: 'How to Use the Goals Section', shows: 'The full Goals page', highlight: 'Show goals grouped under their team headings' },
  { id: 'HELP-002', article: 'How to Use the Goals Section', shows: 'Top-right of the Goals page', highlight: 'Point an arrow at the blue "+ Add Goal" button' },
  { id: 'HELP-003', article: 'How to Use the Goals Section', shows: 'The Add Goal pop-up (open it)', highlight: 'All fields visible: Team, Metric, Goal Value, Tolerance, Start Date, End Date, Active' },
  { id: 'HELP-004', article: 'How to Use the Goals Section', shows: 'An agent or team scorecard row', highlight: 'Highlight the Goal, Tolerance and On Track/Off Track columns together' },
  { id: 'HELP-005', article: 'How to Use the Goals Section', shows: 'The Goals filter bar', highlight: 'Highlight Team, From Date, To Date, Show expired, Show inactive' },
  { id: 'HELP-006', article: 'How to Use the Goals Section', shows: 'The Edit Goal pop-up on an existing goal', highlight: 'Point to the red "Delete Goal" button at bottom-left' },
  { id: 'HELP-007', article: 'How to Use the Metrics Section', shows: 'The full Metrics page', highlight: 'Show the Scored / Additional / Inactive section headings' },
  { id: 'HELP-008', article: 'How to Use the Metrics Section', shows: 'Top of the Metrics page', highlight: 'Point an arrow at the "+ Add Metric" button' },
  { id: 'HELP-009', article: 'How to Use the Metrics Section', shows: 'The Add Metric pop-up (open it)', highlight: 'All fields visible: Metric Name, Key, Unit Type, Direction Good, Display Order' },
  { id: 'HELP-010', article: 'How to Use the Metrics Section', shows: 'The Metrics page', highlight: 'Highlight the Scored Metrics vs Additional Metrics sections' },
  { id: 'HELP-011', article: 'How to Use the Metrics Section', shows: 'Lower part of the Add/Edit Metric pop-up', highlight: 'Point to the "Counts Toward Score" and "Active" checkboxes' },
  { id: 'HELP-012', article: 'How to Read the Agent Performance Page', shows: 'The Agent Performance filter bar', highlight: 'Highlight Team, Agent, Year, Month selectors' },
  { id: 'HELP-013', article: 'How to Read the Agent Performance Page', shows: 'The page header', highlight: 'Point to the colour-coded Overall Rating' },
  { id: 'HELP-014', article: 'How to Read the Agent Performance Page', shows: 'The tab row', highlight: 'Highlight Monthly / Quarterly / Half-Year / YTD / Trend tabs' },
  { id: 'HELP-015', article: 'How to Read the Agent Performance Page', shows: 'A monthly scorecard row', highlight: 'Highlight the Actual, Goal, Tolerance, and Status columns' },
  { id: 'HELP-016', article: 'How to Read the Agent Performance Page', shows: 'The Trend tab open', highlight: 'Show the month-by-month grid for each metric' },
  { id: 'HELP-017', article: 'How to Read the Agent Performance Page', shows: 'The Supervisor Note card', highlight: 'Highlight the Supervisor dropdown, Save Note, and Hide/Show Notes toggle' },
  { id: 'HELP-018', article: 'How to Use the Attendance Page', shows: 'The Attendance Entry grid', highlight: 'Highlight the Year and Month dropdowns at the top' },
  { id: 'HELP-019', article: 'How to Use the Attendance Page', shows: 'A single cell being edited', highlight: 'Show the code pop-up that appears when clicking one cell (no agents ticked)' },
  { id: 'HELP-020', article: 'How to Use the Attendance Page', shows: 'Bulk mode in action', highlight: 'Show ticked agent checkboxes on the left and highlighted date columns' },
  { id: 'HELP-021', article: 'How to Use the Attendance Page', shows: 'The week header row', highlight: 'Point to a week header that selects the whole week' },
  { id: 'HELP-022', article: 'How to Use the Attendance Page', shows: 'The holiday panel', highlight: 'Point to "Apply to all agents" and "Apply to selected" buttons' },
  { id: 'HELP-023', article: 'How to Use the Attendance Page', shows: 'The bulk action buttons', highlight: 'Point to the red "Clear Selected Cells" button' },
  { id: 'HELP-024', article: 'How to Manage Agents', shows: 'The Agents list page', highlight: 'Highlight the Search box and Status filter' },
  { id: 'HELP-025', article: 'How to Manage Agents', shows: 'Top-right of the Agents page', highlight: 'Point to the "+ Add Agent" button' },
  { id: 'HELP-026', article: 'How to Manage Agents', shows: 'The agent profile pop-up (open it)', highlight: 'Show all fields: Name, Role, Reporting Supervisor, Hire Date, Go-Live Date, Employment End Date, Notes, Active' },
  { id: 'HELP-027', article: 'How to Manage Agents', shows: 'The agent profile pop-up', highlight: 'Point specifically to the Employment End Date field and its helper text' },
  { id: 'HELP-028', article: 'How to Manage Agents', shows: 'Bottom of a saved agent profile', highlight: 'Highlight the Team Assignments section with Add Team / Add' },
]
