import { useState, useEffect, useMemo } from 'react'
import {
  getTeams, getAgents,
  getMetricDefinitions, getScorecard, getScorecardYear, getSummary,
} from '../lib/api'
import { formatValue, statusClass, statusLabel, ratingClass, recentMonths } from '../lib/format'

// ── Constants ─────────────────────────────────────────────────────────────────

function getYearOptions() {
  const cur = new Date().getFullYear()
  const years = []
  for (let y = cur + 1; y >= 2023; y--) years.push(String(y))
  return years
}

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] },
]
const HALVES = [
  { label: 'H1', months: [1, 2, 3, 4, 5, 6] },
  { label: 'H2', months: [7, 8, 9, 10, 11, 12] },
]

// ── Rollup helpers ────────────────────────────────────────────────────────────

function metricMonthNum(metricMonth) {
  return parseInt(metricMonth.slice(5, 7), 10)
}

function computePeriodActual(rows, unitType) {
  const withData = rows.filter((r) => r.actual_value != null)
  if (!withData.length) return null
  const sum = withData.reduce((s, r) => s + r.actual_value, 0)
  return unitType === 'count' ? sum : sum / withData.length
}

function deriveStatus(actual, refRow) {
  if (actual == null || !refRow) return 'no_data'
  const { goal_value, tolerance_value, direction_good } = refRow
  if (goal_value == null) return 'no_target'
  const tol = tolerance_value ?? 0
  if (direction_good === 'at_or_above') return actual >= goal_value - tol ? 'on_track' : 'off_track'
  if (direction_good === 'at_or_below') return actual <= goal_value + tol ? 'on_track' : 'off_track'
  return 'no_target'
}

// Returns { metricKey: { actual, status, unitType } } for one agent over a period
function computeAgentPeriodMetrics(agentId, periodMonths, yearDetail, metrics) {
  const agentRows = yearDetail.filter((r) => r.agent_id === agentId)
  const result = {}
  metrics.forEach((metric) => {
    const metricRows = agentRows.filter(
      (r) => r.metric_key === metric.metric_key && periodMonths.includes(metricMonthNum(r.metric_month))
    )
    const dataRows = metricRows.filter((r) => r.actual_value != null)
    if (!dataRows.length) {
      result[metric.metric_key] = { actual: null, status: 'no_data', unitType: metric.unit_type }
      return
    }
    const refRow = [...dataRows].sort((a, b) => b.metric_month.localeCompare(a.metric_month))[0]
    const actual = computePeriodActual(dataRows, metric.unit_type)
    result[metric.metric_key] = { actual, status: deriveStatus(actual, refRow), unitType: metric.unit_type }
  })
  return result
}

// Build display metric list: view data is the primary source so metrics that exist in
// metrics_vw_ab_scorecard but not in metrics_definitions (or are inactive there) still appear.
function buildMetricList(viewRows, fallbackDefs) {
  const seen = new Set()
  const list = []
  viewRows.forEach((r) => {
    if (!seen.has(r.metric_key)) {
      seen.add(r.metric_key)
      list.push({
        metric_key: r.metric_key,
        metric_name: r.metric_name,
        unit_type: r.unit_type,
        direction_good: r.direction_good,
        counts_toward_score: r.counts_toward_score,
        display_order: r.display_order ?? 999,
      })
    }
  })
  fallbackDefs.forEach((m) => {
    if (!seen.has(m.metric_key)) list.push({ ...m, display_order: m.display_order ?? 999 })
  })
  return list.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCell({ row }) {
  if (!row || row.actual_value == null) {
    return <td style={{ textAlign: 'center', color: '#d1d5db' }}>—</td>
  }
  const isTracked = row.metric_status === 'on_track' || row.metric_status === 'off_track'
  return (
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 12 }}>{formatValue(row.actual_value, row.unit_type)}</div>
      {isTracked && (
        <span className={`badge ${statusClass(row.metric_status)}`} style={{ fontSize: 9, marginTop: 2, display: 'inline-block' }}>
          {statusLabel(row.metric_status)}
        </span>
      )}
    </td>
  )
}

function PeriodMetricCell({ cell }) {
  if (!cell || cell.actual == null) {
    return <td style={{ textAlign: 'center', color: '#d1d5db' }}>—</td>
  }
  const isTracked = cell.status === 'on_track' || cell.status === 'off_track'
  return (
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 12 }}>{formatValue(cell.actual, cell.unitType)}</div>
      {isTracked && (
        <span className={`badge ${statusClass(cell.status)}`} style={{ fontSize: 9, marginTop: 2, display: 'inline-block' }}>
          {statusLabel(cell.status)}
        </span>
      )}
    </td>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamDashboard() {
  const monthOptions = recentMonths(24)
  const yearOptions = getYearOptions()

  const [teams, setTeams]       = useState([])
  const [agents, setAgents]     = useState([])
  const [metricDefs, setMetricDefs] = useState([])

  const [teamId, setTeamId]     = useState('')
  const [search, setSearch]     = useState('')
  const [month, setMonth]       = useState(monthOptions[0]?.value ?? '')
  const [rollupYear, setRollupYear] = useState(String(new Date().getFullYear()))

  const [monthDetail, setMonthDetail] = useState([])
  const [summaries, setSummaries]     = useState([])
  const [yearDetail, setYearDetail]   = useState([])

  const [loading, setLoading]         = useState(false)
  const [yearLoading, setYearLoading] = useState(false)
  const [error, setError]             = useState('')

  // Load reference data once; default to first team
  useEffect(() => {
    Promise.all([getTeams(), getMetricDefinitions()])
      .then(([t, m]) => {
        setTeams(t)
        setMetricDefs(m)
        if (t.length > 0) setTeamId(String(t[0].id))
      })
      .catch((e) => setError(e.message))
  }, [])

  // Load all agents with active assignments to this team, including those whose
  // metrics_agents.active may be false (activeOnly: false)
  useEffect(() => {
    if (!teamId) { setAgents([]); return }
    getAgents({ groupId: teamId, activeOnly: false })
      .then(setAgents)
      .catch((e) => setError(e.message))
  }, [teamId])

  const agentIds = useMemo(() => agents.map((a) => a.id), [agents])

  // Load monthly scorecard + summaries when agentIds / month changes
  useEffect(() => {
    if (!agentIds.length || !month) { setMonthDetail([]); setSummaries([]); return }
    setLoading(true)
    setError('')
    Promise.all([
      getScorecard({ agentIds, month }),
      getSummary({ groupId: teamId ? Number(teamId) : undefined, month }),
    ])
      .then(([det, sumRows]) => { setMonthDetail(det); setSummaries(sumRows) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [agentIds, month, teamId])

  // Load year data for rollups
  useEffect(() => {
    if (!agentIds.length || !rollupYear) { setYearDetail([]); return }
    setYearLoading(true)
    getScorecardYear({ year: rollupYear, agentIds })
      .then(setYearDetail)
      .catch((e) => setError(e.message))
      .finally(() => setYearLoading(false))
  }, [agentIds, rollupYear])

  // ── Derived data ─────────────────────────────────────────────────────────────

  // Build display metric lists from view data (primary) + metricDefs (fallback).
  // This surfaces metrics that exist in metrics_vw_ab_scorecard but not in metrics_definitions.
  const allMetrics    = useMemo(() => buildMetricList(monthDetail, metricDefs), [monthDetail, metricDefs])
  const rollupMetrics = useMemo(() => buildMetricList(yearDetail,  metricDefs), [yearDetail,  metricDefs])

  // Scored metrics — only for rating/on-track summary card calculations
  const scoredDefs = useMemo(() => metricDefs.filter((m) => m.counts_toward_score), [metricDefs])

  // agentId → metricKey → scorecard row
  const detailByAgent = useMemo(() => {
    const map = {}
    monthDetail.forEach((r) => {
      if (!map[r.agent_id]) map[r.agent_id] = {}
      map[r.agent_id][r.metric_key] = r
    })
    return map
  }, [monthDetail])

  // Search-filtered agents (controls visible columns)
  const displayAgents = useMemo(
    () => agents.filter((a) => !search || a.agent_name.toLowerCase().includes(search.toLowerCase())),
    [agents, search]
  )

  // Only show agents who have at least one actual value in the selected month
  const activeMonthAgents = useMemo(
    () => displayAgents.filter((a) => monthDetail.some((r) => r.agent_id === a.id && r.actual_value != null)),
    [displayAgents, monthDetail]
  )

  // Only show agents who have at least one actual value anywhere in the rollup year
  const activeYearAgents = useMemo(
    () => displayAgents.filter((a) => yearDetail.some((r) => r.agent_id === a.id && r.actual_value != null)),
    [displayAgents, yearDetail]
  )

  // Pre-compute period rollups for all agents using rollupMetrics (view-derived)
  const quarterlyData = useMemo(() => {
    const result = {}
    agents.forEach((agent) => {
      result[agent.id] = {}
      QUARTERS.forEach((q) => {
        result[agent.id][q.label] = computeAgentPeriodMetrics(agent.id, q.months, yearDetail, rollupMetrics)
      })
    })
    return result
  }, [agents, yearDetail, rollupMetrics])

  const halfData = useMemo(() => {
    const result = {}
    agents.forEach((agent) => {
      result[agent.id] = {}
      HALVES.forEach((h) => {
        result[agent.id][h.label] = computeAgentPeriodMetrics(agent.id, h.months, yearDetail, rollupMetrics)
      })
    })
    return result
  }, [agents, yearDetail, rollupMetrics])

  // Summary card values
  const selectedTeam = teams.find((t) => String(t.id) === teamId)
  const ratingDist   = summaries.reduce((acc, r) => {
    const lbl = r.rating_label ?? r.score_label ?? 'Unknown'
    acc[lbl] = (acc[lbl] ?? 0) + 1
    return acc
  }, {})
  const avgOnTrack = summaries.length
    ? (summaries.reduce((s, r) => s + (r.on_track_count ?? 0), 0) / summaries.length).toFixed(1)
    : '—'

  const monthLabel = monthOptions.find((m) => m.value === month)?.label ?? month

  // Shared sticky-column style
  const stickyCol = { position: 'sticky', left: 0, zIndex: 1, whiteSpace: 'nowrap', minWidth: 160 }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Team Dashboard</h1>
        <p className="page-subtitle">Group performance by month</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="filter-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Team</label>
          <select className="filter-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Select Team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Search Agent</label>
          <input
            className="filter-select"
            style={{ minWidth: 160 }}
            placeholder="Filter by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!teamId && (
        <div className="empty-state">
          <h3>Select a team to view performance</h3>
        </div>
      )}

      {teamId && loading && <div className="loading">Loading...</div>}

      {teamId && !loading && (
        <>
          {/* Summary cards */}
          <div className="cards-row">
            <div className="stat-card">
              <div className="stat-label">Team</div>
              <div className="stat-value" style={{ fontSize: 16, marginTop: 4, color: '#1a1a2e' }}>
                {selectedTeam?.group_name ?? '—'}
              </div>
              <div className="stat-sub">{monthLabel}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Agents</div>
              <div className="stat-value">{agents.length}</div>
              <div className="stat-sub">assigned</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg On Track</div>
              <div className="stat-value" style={{ color: '#1a6e3a' }}>{avgOnTrack}</div>
              <div className="stat-sub">scored metrics / agent</div>
            </div>
            {Object.entries(ratingDist).map(([label, count]) => (
              <div key={label} className="stat-card">
                <div className="stat-label">Rating</div>
                <div className={`stat-value ${ratingClass(label)}`} style={{ fontSize: 16, marginTop: 4 }}>
                  {label}
                </div>
                <div className="stat-sub">{count} agent{count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          {/* Monthly table — rows: metrics, columns: agents */}
          <div className="section-title">Monthly Performance — {monthLabel}</div>

          {activeMonthAgents.length === 0 ? (
            <div className="empty-state">
              <h3>No data this month</h3>
              <p>No agents have recorded data for {monthLabel}.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th className="sticky-metric-head" style={{ ...stickyCol, background: '#f8f9fb', zIndex: 2 }}>Metric</th>
                    {activeMonthAgents.map((a) => (
                      <th key={a.id} style={{ width: 90, minWidth: 80, textAlign: 'center' }}>{a.agent_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allMetrics.map((metric) => (
                    <tr key={metric.metric_key}>
                      <td className="sticky-metric-cell" style={{ ...stickyCol, background: 'inherit' }}>
                        {metric.metric_name}
                      </td>
                      {activeMonthAgents.map((agent) => (
                        <MetricCell key={agent.id} row={detailByAgent[agent.id]?.[metric.metric_key]} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rollup section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 8px' }}>
            <div className="section-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Rollup Year
            </div>
            <select
              className="filter-select"
              style={{ height: 30, fontSize: 13, minWidth: 90 }}
              value={rollupYear}
              onChange={(e) => setRollupYear(e.target.value)}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {yearLoading && <span style={{ fontSize: 12, color: '#6b7a8d' }}>Loading…</span>}
          </div>

          {!yearLoading && activeYearAgents.length > 0 && (
            <>
              {/* Quarterly table — rows: metrics, columns: Q × agents */}
              <div className="section-title">Quarterly Team Summary — {rollupYear}</div>
              <div className="table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="sticky-metric-head" style={{ ...stickyCol, background: '#f8f9fb', verticalAlign: 'bottom', zIndex: 3 }}>Metric</th>
                      {QUARTERS.map((q) => (
                        <th key={q.label} colSpan={activeYearAgents.length} className="period-th">
                          {q.label}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {QUARTERS.map((q) =>
                        activeYearAgents.map((a) => (
                          <th key={`${q.label}-${a.id}`} style={{ width: 75, minWidth: 70, textAlign: 'center', fontSize: 10 }}>
                            {a.agent_name}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rollupMetrics.map((metric) => (
                      <tr key={metric.metric_key}>
                        <td className="sticky-metric-cell" style={{ ...stickyCol, background: 'inherit' }}>
                          {metric.metric_name}
                        </td>
                        {QUARTERS.map((q) =>
                          activeYearAgents.map((agent) => (
                            <PeriodMetricCell
                              key={`${q.label}-${agent.id}`}
                              cell={quarterlyData[agent.id]?.[q.label]?.[metric.metric_key]}
                            />
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Half-year table — rows: metrics, columns: H × agents */}
              <div className="section-title">Half-Year Team Summary — {rollupYear}</div>
              <div className="table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="sticky-metric-head" style={{ ...stickyCol, background: '#f8f9fb', verticalAlign: 'bottom', zIndex: 3 }}>Metric</th>
                      {HALVES.map((h) => (
                        <th key={h.label} colSpan={activeYearAgents.length} className="period-th">
                          {h.label}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {HALVES.map((h) =>
                        activeYearAgents.map((a) => (
                          <th key={`${h.label}-${a.id}`} style={{ width: 75, minWidth: 70, textAlign: 'center', fontSize: 10 }}>
                            {a.agent_name}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rollupMetrics.map((metric) => (
                      <tr key={metric.metric_key}>
                        <td className="sticky-metric-cell" style={{ ...stickyCol, background: 'inherit' }}>
                          {metric.metric_name}
                        </td>
                        {HALVES.map((h) =>
                          activeYearAgents.map((agent) => (
                            <PeriodMetricCell
                              key={`${h.label}-${agent.id}`}
                              cell={halfData[agent.id]?.[h.label]?.[metric.metric_key]}
                            />
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
