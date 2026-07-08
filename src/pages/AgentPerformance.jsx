import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  getTeams, getAgents, getAllAgents,
  getAllMetricDefinitions, getScorecard, getScorecardYear,
  getSummary, getAgentMonthNote, upsertAgentMonthNote, getActiveGoals,
} from '../lib/api'
import { formatValue, statusLabel, statusClass, ratingClass, computeRating } from '../lib/format'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },  { value: '02', label: 'February' },
  { value: '03', label: 'March' },    { value: '04', label: 'April' },
  { value: '05', label: 'May' },      { value: '06', label: 'June' },
  { value: '07', label: 'July' },     { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

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

// Uses direction_good values: 'at_or_above' | 'at_or_below'
function deriveStatus(actual, refRow) {
  if (actual == null || !refRow) return 'no_data'
  const { goal_value, tolerance_value, direction_good } = refRow
  if (goal_value == null) return 'no_target'
  const tol = tolerance_value ?? 0
  if (direction_good === 'at_or_above') return actual >= goal_value - tol ? 'on_track' : 'off_track'
  if (direction_good === 'at_or_below') return actual <= goal_value + tol ? 'on_track' : 'off_track'
  return 'no_target'
}

// Ensure all configured metrics show even when view returns no row for that metric
function mergeMetrics(configuredList, viewRows) {
  return configuredList.map((metric) => {
    const dataRow = viewRows.find((r) => r.metric_key === metric.metric_key)
    if (dataRow) return dataRow
    return {
      metric_key: metric.metric_key,
      metric_name: metric.metric_name,
      unit_type: metric.unit_type,
      direction_good: metric.direction_good,
      counts_toward_score: metric.counts_toward_score,
      actual_value: null,
      goal_value: null,
      tolerance_value: null,
      on_track: null,
      metric_status: 'no_data',
    }
  })
}

// Build display metric list from view rows (primary) + metricDefs (fallback for no-data rows).
// inactiveKeys: Set of metric_key strings to skip from view rows.
function buildMetricList(viewRows, fallbackDefs, inactiveKeys = new Set()) {
  const seen = new Set()
  const list = []
  viewRows.forEach((r) => {
    if (!seen.has(r.metric_key) && !inactiveKeys.has(r.metric_key)) {
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

// APT-81: Override goal/tolerance/status on scorecard rows with historically correct values
function applyHistoricalGoals(rows, histGoals) {
  if (!histGoals.length) return rows
  const goalMap = {}
  histGoals.forEach((g) => {
    const key = g.metrics_definitions?.metric_key
    if (key) goalMap[key] = { goal_value: g.goal_value, tolerance_value: g.tolerance_value }
  })
  return rows.map((row) => {
    const g = goalMap[row.metric_key]
    if (!g) return row
    const { goal_value, tolerance_value } = g
    const metric_status = row.actual_value != null
      ? deriveStatus(row.actual_value, { goal_value, tolerance_value, direction_good: row.direction_good })
      : row.metric_status
    return { ...row, goal_value, tolerance_value, metric_status }
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusCell({ status }) {
  if (status === 'on_track' || status === 'off_track') {
    return <span className={`badge ${statusClass(status)}`}>{statusLabel(status)}</span>
  }
  return <span style={{ color: '#9ca3af', fontSize: 11, fontStyle: 'italic' }}>{statusLabel(status)}</span>
}

function MetricRow({ row }) {
  const hasActual = row.actual_value != null
  return (
    <tr>
      <td style={{ fontWeight: 500, minWidth: 160 }}>{row.metric_name}</td>
      <td style={{ textAlign: 'right', fontWeight: hasActual ? 600 : 400, color: hasActual ? '#1a1a2e' : '#adb5bd' }}>
        {hasActual ? formatValue(row.actual_value, row.unit_type) : '—'}
      </td>
      <td style={{ textAlign: 'right', color: '#6b7a8d' }}>
        {row.goal_value != null ? formatValue(row.goal_value, row.unit_type) : '—'}
      </td>
      <td style={{ textAlign: 'right', color: '#6b7a8d' }}>
        {row.tolerance_value != null ? `±${row.tolerance_value}` : '—'}
      </td>
      <td><StatusCell status={row.metric_status} /></td>
    </tr>
  )
}

function RollupTable({ title, periods, configuredMetrics, yearDetail }) {
  return (
    <>
      <div className="section-title">{title}</div>
      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th className="sticky-metric-head" style={{ minWidth: 160, position: 'sticky', left: 0, zIndex: 2 }}>Metric</th>
              {periods.map((p) => (
                <th key={p.label} className="period-th" style={{ minWidth: 90, width: 90 }}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configuredMetrics.map((metric) => {
              const metricRows = yearDetail.filter((r) => r.metric_key === metric.metric_key)
              const refRow = [...metricRows]
                .filter((r) => r.actual_value != null)
                .sort((a, b) => b.metric_month.localeCompare(a.metric_month))[0]
              return (
                <tr key={metric.metric_key}>
                  <td className="sticky-metric-cell" style={{ position: 'sticky', left: 0, background: 'inherit' }}>
                    {metric.metric_name}
                  </td>
                  {periods.map((p) => {
                    const periodRows = metricRows.filter((r) =>
                      p.months.includes(metricMonthNum(r.metric_month))
                    )
                    const actual = computePeriodActual(periodRows, metric.unit_type)
                    const status = deriveStatus(actual, refRow)
                    const isTracked = status === 'on_track' || status === 'off_track'
                    return (
                      <td key={p.label} style={{ textAlign: 'center', width: 90 }}>
                        {actual == null ? (
                          <span style={{ color: '#d1d5db' }}>—</span>
                        ) : (
                          <>
                            <div style={{ fontWeight: 700, fontSize: 12 }}>{formatValue(actual, metric.unit_type)}</div>
                            {isTracked && (
                              <span className={`badge ${statusClass(status)}`} style={{ fontSize: 9, marginTop: 2, display: 'inline-block' }}>
                                {statusLabel(status)}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? v : fallback } catch { return fallback }
}
function savePref(key, val) { try { localStorage.setItem(key, val) } catch {} }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentPerformance() {
  const now = new Date()
  const yearOptions = getYearOptions()
  const savedAgentRef = useRef(loadPref('ktp_ap_agent', ''))

  const [teams, setTeams]   = useState([])
  const [agents, setAgents] = useState([])
  const [allDefs, setAllDefs] = useState([])

  // APT-61: Persistent filters
  const [teamId, setTeamId]   = useState(() => loadPref('ktp_ap_team', ''))
  const [agentId, setAgentId] = useState(() => loadPref('ktp_ap_agent', ''))
  const [year, setYear]       = useState(() => loadPref('ktp_ap_year', String(now.getFullYear())))
  const [selMonth, setSelMonth] = useState(() => loadPref('ktp_ap_month', String(now.getMonth() + 1).padStart(2, '0')))

  // APT-41: Period view tabs
  const [viewMode, setViewMode] = useState(() => loadPref('ktp_ap_view', 'monthly'))

  // APT-78/79: Show/hide inactive agents
  const [showInactive, setShowInactive] = useState(false)

  const [monthDetail, setMonthDetail] = useState([])
  const [summary, setSummary]         = useState(null)
  const [yearDetail, setYearDetail]   = useState([])
  const [note, setNote]               = useState('')
  const [savedNote, setSavedNote]     = useState('')
  const [noteSaving, setNoteSaving]   = useState(false)
  const [noteMsg, setNoteMsg]         = useState('')
  const [noteCreatedAt, setNoteCreatedAt] = useState(null)
  const [noteCreatedBy, setNoteCreatedBy] = useState(null)
  const [noteSupervisor, setNoteSupervisor] = useState(() => { try { return localStorage.getItem('ktp_ap_supervisor') || '' } catch { return '' } })
  const [supervisors, setSupervisors] = useState([])
  const [notesVisible, setNotesVisible] = useState(true)

  const [loading, setLoading]         = useState(false)
  const [yearLoading, setYearLoading] = useState(false)
  const [error, setError]             = useState('')

  // APT-61: Save filter prefs
  useEffect(() => savePref('ktp_ap_team', teamId), [teamId])
  useEffect(() => savePref('ktp_ap_agent', agentId), [agentId])
  useEffect(() => savePref('ktp_ap_year', year), [year])
  useEffect(() => savePref('ktp_ap_month', selMonth), [selMonth])
  useEffect(() => savePref('ktp_ap_view', viewMode), [viewMode])

  // APT-65: Load all metric definitions (active + inactive)
  useEffect(() => {
    getTeams().then(setTeams).catch((e) => setError(e.message))
    getAllMetricDefinitions().then(setAllDefs).catch((e) => setError(e.message))
    getAllAgents().then((all) => setSupervisors(all.filter((a) => a.role === 'Supervisor' && a.active))).catch(() => {})
  }, [])

  // APT-65: Derive active metricDefs and inactiveKeys
  const metricDefs = useMemo(() => allDefs.filter((d) => d.active), [allDefs])
  const inactiveKeys = useMemo(() => new Set(allDefs.filter((d) => !d.active).map((d) => d.metric_key)), [allDefs])

  // APT-78/79: Visible agents in dropdown (filter inactive unless toggled)
  const visibleAgents = useMemo(
    () => showInactive ? agents : agents.filter((a) => a.active !== false),
    [agents, showInactive]
  )

  // Reload agents when team filter changes
  useEffect(() => {
    setAgentId('')
    getAgents({ groupId: teamId || undefined })
      .then((list) => {
        setAgents(list)
        if (savedAgentRef.current) {
          const match = list.find((a) => String(a.id) === savedAgentRef.current)
          if (match) setAgentId(savedAgentRef.current)
          savedAgentRef.current = ''
        }
      })
      .catch((e) => setError(e.message))
  }, [teamId])

  // Load monthly data when agent / year / month / team changes
  useEffect(() => {
    if (!agentId) return
    const monthKey = `${year}-${selMonth}`
    setLoading(true)
    setError('')
    Promise.all([
      getScorecard({ agentId: Number(agentId), month: monthKey }),
      getSummary({ agentId: Number(agentId), month: monthKey }),
      getAgentMonthNote({ agentId: Number(agentId), noteMonth: monthKey }),
      teamId ? getActiveGoals({ groupId: teamId, month: monthKey }) : Promise.resolve([]),
    ])
      .then(([sc, sumRows, noteRow, histGoals]) => {
        setMonthDetail(applyHistoricalGoals(sc, histGoals))
        setSummary(sumRows[0] ?? null)
        const t = noteRow?.note_text ?? ''
        setNote(t)
        setSavedNote(t)
        setNoteCreatedAt(noteRow?.created_at ?? null)
        setNoteCreatedBy(noteRow?.created_by ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [agentId, year, selMonth, teamId])

  // Load year data for rollups
  useEffect(() => {
    if (!agentId) return
    setYearLoading(true)
    getScorecardYear({ agentId: Number(agentId), year })
      .then(setYearDetail)
      .catch((e) => setError(e.message))
      .finally(() => setYearLoading(false))
  }, [agentId, year])

  const saveNote = async () => {
    if (!agentId) return
    setNoteSaving(true)
    setNoteMsg('')
    try {
      await upsertAgentMonthNote({
        agentId: Number(agentId),
        noteMonth: `${year}-${selMonth}`,
        noteText: note,
        createdBy: noteSupervisor || null,
      })
      setSavedNote(note)
      setNoteCreatedBy(noteSupervisor || null)
      setNoteMsg('Saved.')
      if (!noteCreatedAt) setNoteCreatedAt(new Date().toISOString())
      setTimeout(() => setNoteMsg(''), 3000)
    } catch (e) {
      setNoteMsg('Error: ' + e.message)
    } finally {
      setNoteSaving(false)
    }
  }

  // APT-65: Build display metric list with inactiveKeys filter
  const allMetrics    = useMemo(() => buildMetricList(monthDetail, metricDefs, inactiveKeys), [monthDetail, metricDefs, inactiveKeys])
  const rollupMetrics = useMemo(() => buildMetricList(yearDetail,  metricDefs, inactiveKeys), [yearDetail,  metricDefs, inactiveKeys])

  // Merge produces a row for every display metric (placeholder when agent has no data for it)
  const allRows = mergeMetrics(allMetrics, monthDetail)

  const selectedMonthLabel = MONTH_OPTIONS.find((m) => m.value === selMonth)?.label ?? selMonth

  // APT-36: Compute rating from scorecard rows (counts_toward_score metrics with data + goal only)
  const computedRating = useMemo(() => computeRating(allRows), [allRows])
  const ratingLabel   = computedRating.label
  const onTrackCount  = computedRating.onTrack
  const offTrackCount = computedRating.offTrack
  const withDataCount = computedRating.total

  // APT-49: YTD computed data
  const ytdData = useMemo(() => {
    const curMonth = new Date().getMonth() + 1
    const ytdRows = yearDetail.filter((r) => {
      const m = parseInt(r.metric_month.slice(5, 7), 10)
      return m <= curMonth && r.actual_value != null
    })
    return rollupMetrics.map((metric) => {
      const rows = ytdRows.filter((r) => r.metric_key === metric.metric_key)
      if (!rows.length) return { ...metric, actual: null, status: 'no_data' }
      const actual = computePeriodActual(rows, metric.unit_type)
      const refRow = [...rows].sort((a, b) => b.metric_month.localeCompare(a.metric_month))[0]
      return { ...metric, actual, status: deriveStatus(actual, refRow) }
    })
  }, [yearDetail, rollupMetrics])

  // APT-50: Trend months
  const trendMonths = useMemo(() => {
    const months = [...new Set(yearDetail.map((r) => r.metric_month))].sort()
    return months
  }, [yearDetail])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agent Performance</h1>
        <p className="page-subtitle">Monthly scorecard by agent</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Team</label>
          <select className="filter-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Agent</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select className="filter-select" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">Select Agent</option>
              {visibleAgents.map((a) => <option key={a.id} value={a.id}>{a.agent_name}</option>)}
            </select>
            {agentId && (
              <Link
                to={`/admin/agents?agent=${agentId}`}
                className="btn btn-secondary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
                title="View agent admin profile"
              >
                Profile →
              </Link>
            )}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Year</label>
          <select className="filter-select" style={{ minWidth: 90 }} value={year} onChange={(e) => setYear(e.target.value)}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="filter-select" value={selMonth} onChange={(e) => setSelMonth(e.target.value)}>
            {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {/* APT-78/79: Show inactive toggle */}
        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: '#6b7a8d', paddingTop: 18 }}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
        </div>
      </div>

      {!agentId && (
        <div className="empty-state">
          <h3>Select an agent to view performance</h3>
          <p>Optionally filter by team, then choose an agent.</p>
        </div>
      )}

      {agentId && loading && <div className="loading">Loading…</div>}

      {agentId && !loading && (
        <>
          {/* Summary cards */}
          <div className="cards-row">
            <div className="stat-card">
              <div className="stat-label">Overall Rating</div>
              <div className={`stat-value ${ratingClass(summary?.rating_label)}`} style={{ fontSize: 18, marginTop: 4 }}>
                {ratingLabel}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">On Track</div>
              <div className="stat-value" style={{ color: '#1a6e3a' }}>{onTrackCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Off Track</div>
              <div className="stat-value" style={{ color: '#842029' }}>{offTrackCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">With Data</div>
              <div className="stat-value">{withDataCount}</div>
            </div>
          </div>

          {/* APT-41: Period view tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e6ea', marginBottom: 20 }}>
            {[
              { key: 'monthly', label: 'Monthly' },
              { key: 'quarterly', label: 'Quarterly' },
              { key: 'halfyear', label: 'Half-Year' },
              { key: 'ytd', label: 'YTD' },
              { key: 'trend', label: 'Trend' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                style={{
                  padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: viewMode === key ? 700 : 400,
                  color: viewMode === key ? '#4a90e2' : '#6b7a8d',
                  borderBottom: viewMode === key ? '2px solid #4a90e2' : '2px solid transparent',
                  marginBottom: -2,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Monthly view */}
          {viewMode === 'monthly' && (
            <>
              <div className="section-title">Metrics — {selectedMonthLabel} {year}</div>
              <div className="table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 160 }}>Metric</th>
                      <th style={{ width: 90, textAlign: 'right' }}>Actual</th>
                      <th style={{ width: 80, textAlign: 'right' }}>Goal</th>
                      <th style={{ width: 80, textAlign: 'right' }}>Tolerance</th>
                      <th style={{ width: 100 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map((r) => <MetricRow key={r.metric_key} row={r} />)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Quarterly view */}
          {viewMode === 'quarterly' && (
            yearLoading ? (
              <div className="loading">Loading annual data…</div>
            ) : (
              <RollupTable
                title={`Quarterly Performance — ${year}`}
                periods={QUARTERS}
                configuredMetrics={rollupMetrics}
                yearDetail={yearDetail}
              />
            )
          )}

          {/* Half-Year view */}
          {viewMode === 'halfyear' && (
            yearLoading ? (
              <div className="loading">Loading annual data…</div>
            ) : (
              <RollupTable
                title={`Half-Year Performance — ${year}`}
                periods={HALVES}
                configuredMetrics={rollupMetrics}
                yearDetail={yearDetail}
              />
            )
          )}

          {/* APT-49: YTD view */}
          {viewMode === 'ytd' && (
            <>
              <div className="section-title">Year to Date — {year}</div>
              {yearLoading ? <div className="loading">Loading…</div> : (
                <div className="table-wrap">
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 160 }}>Metric</th>
                        <th style={{ width: 90, textAlign: 'right' }}>YTD Actual</th>
                        <th style={{ width: 80, textAlign: 'right' }}>Goal</th>
                        <th style={{ width: 100 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ytdData.map((row) => (
                        <tr key={row.metric_key}>
                          <td style={{ fontWeight: 500 }}>{row.metric_name}</td>
                          <td style={{ textAlign: 'right', fontWeight: row.actual != null ? 600 : 400, color: row.actual != null ? '#1a1a2e' : '#adb5bd' }}>
                            {row.actual != null ? formatValue(row.actual, row.unit_type) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', color: '#6b7a8d' }}>
                            {row.goal_value != null ? formatValue(row.goal_value, row.unit_type) : '—'}
                          </td>
                          <td><StatusCell status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* APT-50: Trend view */}
          {viewMode === 'trend' && (
            <>
              <div className="section-title">Monthly Trend — {year}</div>
              {yearLoading ? <div className="loading">Loading…</div> : (
                <div className="table-wrap">
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th className="sticky-metric-head" style={{ minWidth: 160, position: 'sticky', left: 0, zIndex: 2 }}>Metric</th>
                        {trendMonths.map((m) => (
                          <th key={m} className="period-th" style={{ minWidth: 70, width: 70, textAlign: 'center' }}>
                            {new Date(m.slice(0, 7) + '-02').toLocaleString('default', { month: 'short' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rollupMetrics.map((metric) => (
                        <tr key={metric.metric_key}>
                          <td className="sticky-metric-cell" style={{ position: 'sticky', left: 0, background: 'inherit', fontWeight: 500 }}>
                            {metric.metric_name}
                          </td>
                          {trendMonths.map((m) => {
                            const row = yearDetail.find((r) => r.metric_key === metric.metric_key && r.metric_month === m)
                            const val = row?.actual_value
                            return (
                              <td key={m} style={{ textAlign: 'center', color: val != null ? '#1a1a2e' : '#d1d5db', fontWeight: val != null ? 600 : 400 }}>
                                {val != null ? formatValue(val, metric.unit_type) : '—'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* APT-91: Supervisor Note with hide/show toggle */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: notesVisible ? 12 : 0 }}>
              <div className="card-title" style={{ margin: 0 }}>Supervisor Note — {selectedMonthLabel} {year}</div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setNotesVisible((v) => !v)}
                style={{ fontSize: 11 }}
              >
                {notesVisible ? 'Hide Notes' : 'Show Notes'}
              </button>
            </div>
            {notesVisible && (
              <>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Supervisor</label>
                  <select
                    className="form-select"
                    value={noteSupervisor}
                    onChange={(e) => {
                      setNoteSupervisor(e.target.value)
                      try { localStorage.setItem('ktp_ap_supervisor', e.target.value) } catch {}
                    }}
                  >
                    <option value="">— Select supervisor —</option>
                    {supervisors.map((s) => <option key={s.id} value={s.agent_name}>{s.agent_name}</option>)}
                  </select>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%', marginBottom: 8 }}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a supervisor note for this agent and month…"
                  rows={4}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveNote}
                    disabled={noteSaving || note === savedNote}
                  >
                    {noteSaving ? 'Saving…' : 'Save Note'}
                  </button>
                  {noteMsg && (
                    <span style={{ fontSize: 12, color: noteMsg.startsWith('Error') ? '#842029' : '#1a6e3a' }}>
                      {noteMsg}
                    </span>
                  )}
                </div>
                {(noteCreatedAt || noteCreatedBy) && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                    {noteCreatedBy && <span>By: {noteCreatedBy}{noteCreatedAt ? ' · ' : ''}</span>}
                    {noteCreatedAt && <span>Created: {new Date(noteCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
